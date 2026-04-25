import { chatRepository } from '../repositories/chat.repository.js';
import { askAI, filterInput, validateOutput } from '../config/aiProvider.js';
import { safeRedisGet, safeRedisSetex, safeRedisDel, getRedis, isRedisAvailable, REDIS_KEYS } from '../config/redis.js';

const CACHE_TTL = 60 * 60; // 1 hour for chat history cache

const OFF_TOPIC_REPLY = 'Maaf, saya hanya dapat membantu pertanyaan seputar TBC dan kesehatan paru-paru.';
const INJECTION_REPLY = 'Permintaan Anda tidak dapat diproses. Saya hanya menjawab pertanyaan seputar TBC.';

export const chatService = {
  async chat(userId, rawMessage) {
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

    // Ambil histori chat pengguna (10 chat terakhir untuk jadi memori obrolan)
    const historyData = await chatRepository.findByUserId(userId, { page: 1, limit: 10 });
    const history = historyData.items.reverse(); // Urutkan dari yang terlama ke terbaru

    const rawResponse = await askAI(safeMessage, history);
    const response = validateOutput(rawResponse);

    const record = await chatRepository.create({ userId, message: safeMessage, response });

    // Invalidate user chat cache
    await safeRedisDel(REDIS_KEYS.chatHistory(userId));

    return { response, id: record.id, filtered: false };
  },

  async getHistory(userId, { page = 1, limit = 20 } = {}) {
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
