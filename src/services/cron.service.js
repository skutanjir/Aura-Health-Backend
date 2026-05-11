import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();
const parser = new Parser({ timeout: 10000 });

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE = 'https://newsapi.org/v2';
const ARTICLE_SYNC_INTERVAL = process.env.ARTICLE_SYNC_INTERVAL || '1h';

function parseArticleSyncInterval(value) {
  const match = String(value).trim().toLowerCase().match(/^(\d+)\s*(s|sec|second|seconds|detik|m|min|minute|minutes|menit|h|hour|hours|jam|d|day|days|hari)$/);
  if (!match) return '0 * * * *';

  const amount = Number(match[1]);
  const unit = match[2];
  if (!Number.isInteger(amount) || amount < 1) return '0 * * * *';

  if (['s', 'sec', 'second', 'seconds', 'detik'].includes(unit)) return `*/${Math.min(amount, 59)} * * * * *`;
  if (['m', 'min', 'minute', 'minutes', 'menit'].includes(unit)) return `*/${Math.min(amount, 59)} * * * *`;
  if (['h', 'hour', 'hours', 'jam'].includes(unit)) return `0 */${Math.min(amount, 23)} * * *`;
  return `0 0 */${Math.min(amount, 31)} * *`;
}

const RSS_SOURCES = [
  {
    url: 'https://news.google.com/rss/search?q=Tuberkulosis+OR+TBC+kesehatan+when:1y&hl=id&gl=ID&ceid=ID:id',
    category: 'Berita & Info Medis',
    author: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=tuberculosis+health+treatment&hl=en&gl=US&ceid=US:en',
    category: 'Berita & Info Medis',
    author: 'Google News',
  },
  {
    url: 'https://www.who.int/rss-feeds/news-english.xml',
    category: 'WHO & Kesehatan Global',
    author: 'WHO',
  },
  {
    url: 'https://health.detik.com/rss',
    category: 'Kesehatan',
    author: 'Detik Health',
  },
  {
    url: 'https://www.antaranews.com/rss/terkini.xml',
    category: 'Berita Terkini',
    author: 'Antara News',
  },
  {
    url: 'https://news.google.com/rss/search?q=kesehatan+paru+Indonesia&hl=id&gl=ID&ceid=ID:id',
    category: 'Penyakit Paru',
    author: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=penyakit+menular+Indonesia&hl=id&gl=ID&ceid=ID:id',
    category: 'Penyakit Menular',
    author: 'Google News',
  },
  {
    url: 'https://news.google.com/rss/search?q=vaksin+imunisasi+Indonesia&hl=id&gl=ID&ceid=ID:id',
    category: 'Vaksin & Imunisasi',
    author: 'Google News',
  },
];

const NEWSAPI_QUERIES = [
  { q: 'tuberkulosis OR TBC', language: 'id', category: 'Tuberkulosis (TBC)' },
  { q: 'penyakit paru kesehatan', language: 'id', category: 'Penyakit Paru' },
  { q: 'kesehatan masyarakat Indonesia', language: 'id', category: 'Kesehatan Masyarakat' },
  { q: 'tuberculosis treatment cure', language: 'en', category: 'Riset & Pengobatan' },
  { q: 'vaksin imunisasi Indonesia', language: 'id', category: 'Vaksin & Imunisasi' },
];

const TBC_KEYWORDS = [
  'tbc', 'tuberkulosis', 'tuberculosis', 'tb paru', 'batuk kronis',
  'mycobacterium', 'oat obat', 'paru-paru', 'paru paru', 'pneumonia',
  'infeksi paru', 'kesehatan paru', 'imunisasi', 'vaksin bcg',
  'mdr-tb', 'resistansi obat', 'kemenkes', 'puskesmas', 'faskes',
  'penyakit menular', 'epidemi', 'kesehatan',
];

function isRelevant(title = '', content = '') {
  const text = (title + ' ' + content).toLowerCase();
  return TBC_KEYWORDS.some((kw) => text.includes(kw));
}

function sanitizeText(text = '') {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function titleExists(title) {
  const found = await prisma.article.findFirst({
    where: { title: { equals: title.trim(), mode: 'insensitive' } },
  });
  return !!found;
}

async function insertIfNew(data) {
  if (await titleExists(data.title)) return false;
  await prisma.article.create({ data });
  return true;
}

async function fetchFromNewsApi() {
  if (!NEWS_API_KEY) return 0;

  let total = 0;
  for (const query of NEWSAPI_QUERIES) {
    try {
      const url = new URL(`${NEWS_API_BASE}/everything`);
      url.searchParams.set('q', query.q);
      url.searchParams.set('language', query.language);
      url.searchParams.set('sortBy', 'publishedAt');
      url.searchParams.set('pageSize', '20');
      url.searchParams.set('apiKey', NEWS_API_KEY);

      const res = await fetch(url.toString());
      const json = await res.json();

      if (json.status !== 'ok') continue;

      for (const item of (json.articles || [])) {
        if (!item.title || item.title === '[Removed]') continue;
        if (!isRelevant(item.title, item.description || '')) continue;

        const content = sanitizeText(item.content || item.description || '');
        const summary = sanitizeText(item.description || '').substring(0, 200);

        const inserted = await insertIfNew({
          title: item.title,
          content: content + (item.url ? `\n\nSumber: ${item.url}` : ''),
          summary: summary || item.title.substring(0, 150),
          category: query.category,
          author: item.source?.name || 'NewsAPI',
          imageUrl: item.urlToImage || 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&q=80',
          publishedAt: new Date(item.publishedAt || new Date()),
        });

        if (inserted) total++;
      }

      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      logger.error(`Cron: NewsAPI fetch failed for "${query.q}"`, err);
    }
  }

  return total;
}

async function fetchFromRss() {
  let total = 0;

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);

      for (const item of feed.items) {
        if (!item.title) continue;

        const rawContent = item.content || item.contentSnippet || item['content:encoded'] || '';
        const clean = sanitizeText(rawContent);
        if (!isRelevant(item.title, clean)) continue;

        const summary = sanitizeText(item.contentSnippet || '').substring(0, 200);
        const content = clean || sanitizeText(item.contentSnippet || '');

        const inserted = await insertIfNew({
          title: item.title.trim(),
          content: (content || summary) + (item.link ? `\n\nSumber: ${item.link}` : ''),
          summary: summary || item.title.substring(0, 150),
          category: source.category,
          author: item.creator || item.author || source.author,
          imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&q=80',
          publishedAt: new Date(item.pubDate || item.isoDate || new Date()),
        });

        if (inserted) total++;
      }
    } catch (err) {
      logger.error(`Cron: RSS fetch failed for ${source.url}`, err);
    }
  }

  return total;
}

async function syncArticles() {
  let total = 0;
  total += await fetchFromNewsApi();
  total += await fetchFromRss();
  logger.info(`Cron: Synced ${total} new articles from all sources.`);
}

async function cleanupOldArticles() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await prisma.article.deleteMany({
      where: { createdAt: { lt: thirtyDaysAgo } },
    });
    logger.info(`Cron: Deleted ${result.count} old articles.`);
  } catch (err) {
    logger.error('Cron: Error cleaning up articles', err);
  }
}

export function startCronJobs() {
  const syncSchedule = parseArticleSyncInterval(ARTICLE_SYNC_INTERVAL);

  cron.schedule(syncSchedule, async () => {
    logger.info(`Cron: Starting article sync (${ARTICLE_SYNC_INTERVAL})...`);
    await syncArticles();
  });

  cron.schedule('0 0 * * *', async () => {
    logger.info('Cron: Cleaning up old articles...');
    await cleanupOldArticles();
  });
}
