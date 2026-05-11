import { chatRepository } from '../repositories/chat.repository.js';
import { askAI, filterInput, validateOutput, isHospitalQuery, buildHospitalContext } from '../config/aiProvider.js';
import { safeRedisGet, safeRedisSetex, safeRedisDel, getRedis, isRedisAvailable, REDIS_KEYS } from '../config/redis.js';

const CACHE_TTL = 60 * 60;

const OFF_TOPIC_REPLY = 'Maaf, aku hanya bisa membantu topik kesehatan, TBC, paru-paru, dan keluhan kesehatan umum.';
const INJECTION_REPLY = 'Maaf, permintaan itu tidak bisa aku proses. Aku hanya bisa membantu seputar kesehatan.';
const NO_LOCATION_HOSPITAL_REPLY = 'Untuk mencari rumah sakit atau klinik terdekat, aktifkan lokasi terlebih dahulu lalu tanya lagi. Aku akan membantu memberi arahan yang sesuai.';

export const chatService = {
  async chat(userId, rawMessage, location = null) {
    let safeMessage;

    try {
      safeMessage = filterInput(rawMessage);
    } catch (err) {
      if (err.message === 'OFF_TOPIC') {
        await chatRepository.create({ userId, message: rawMessage, response: OFF_TOPIC_REPLY });
        return { response: OFF_TOPIC_REPLY, filtered: true };
      }
      if (err.message === 'INJECTION_DETECTED') {
        await chatRepository.create({ userId, message: rawMessage, response: INJECTION_REPLY });
        return { response: INJECTION_REPLY, filtered: true };
      }
      throw err;
    }

    if (isHospitalQuery(safeMessage) && !location) {
      await chatRepository.create({ userId, message: safeMessage, response: NO_LOCATION_HOSPITAL_REPLY });
      return { response: NO_LOCATION_HOSPITAL_REPLY, filtered: false };
    }

    const messageForAI = location ? buildHospitalContext(safeMessage, location) : safeMessage;

    const historyData = await chatRepository.findByUserId(userId, { page: 1, limit: 10 });
    const history = historyData.items.reverse();

    const rawResponse = await askAI(messageForAI, history);
    const response = validateOutput(rawResponse);

    const record = await chatRepository.create({ userId, message: safeMessage, response });

    if (isRedisAvailable()) {
      try {
        const keys = await getRedis().keys(`${REDIS_KEYS.chatHistory(userId)}*`);
        if (keys.length) await getRedis().del(...keys);
      } catch {}
    }

    return { response, id: record.id, filtered: false };
  },

  async getHistory(userId, { page = 1, limit = 1000 } = {}) {
    const cacheKey = `${REDIS_KEYS.chatHistory(userId)}:${page}`;
    const cached = await safeRedisGet(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await chatRepository.findByUserId(userId, { page, limit });
    const data = {
      history: result.items,
      meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    };

    await safeRedisSetex(cacheKey, CACHE_TTL, JSON.stringify(data));
    return data;
  },

  async clearHistory(userId) {
    await chatRepository.deleteByUserId(userId);
    if (isRedisAvailable()) {
      try {
        const keys = await getRedis().keys(`${REDIS_KEYS.chatHistory(userId)}*`);
        if (keys.length) await getRedis().del(...keys);
      } catch {}
    }
  },
};
