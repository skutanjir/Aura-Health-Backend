import { PrismaClient } from '@prisma/client';
import Parser from 'rss-parser';
import 'dotenv/config';

const prisma = new PrismaClient();
const parser = new Parser({ timeout: 10000 });

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_BASE = 'https://newsapi.org/v2';

const RSS_SOURCES = [
  {
    url: 'https://news.google.com/rss/search?q=Tuberkulosis+OR+TBC+kesehatan+when:1y&hl=id&gl=ID&ceid=ID:id',
    category: 'Berita & Info Medis',
    author: 'Google News',
    lang: 'id',
  },
  {
    url: 'https://news.google.com/rss/search?q=tuberculosis+health+treatment&hl=en&gl=US&ceid=US:en',
    category: 'Berita & Info Medis',
    author: 'Google News',
    lang: 'en',
  },
  {
    url: 'https://www.who.int/rss-feeds/news-english.xml',
    category: 'WHO & Kesehatan Global',
    author: 'WHO',
    lang: 'en',
  },
  {
    url: 'https://health.detik.com/rss',
    category: 'Kesehatan',
    author: 'Detik Health',
    lang: 'id',
  },
  {
    url: 'https://www.antaranews.com/rss/terkini.xml',
    category: 'Berita Terkini',
    author: 'Antara News',
    lang: 'id',
  },
  {
    url: 'https://news.google.com/rss/search?q=kesehatan+paru+Indonesia&hl=id&gl=ID&ceid=ID:id',
    category: 'Penyakit Paru',
    author: 'Google News',
    lang: 'id',
  },
  {
    url: 'https://news.google.com/rss/search?q=penyakit+menular+Indonesia&hl=id&gl=ID&ceid=ID:id',
    category: 'Penyakit Menular',
    author: 'Google News',
    lang: 'id',
  },
  {
    url: 'https://news.google.com/rss/search?q=vaksin+imunisasi+Indonesia&hl=id&gl=ID&ceid=ID:id',
    category: 'Vaksin & Imunisasi',
    author: 'Google News',
    lang: 'id',
  },
];

const NEWSAPI_QUERIES = [
  { q: 'tuberkulosis OR TBC', language: 'id', category: 'Tuberkulosis (TBC)' },
  { q: 'penyakit paru kesehatan', language: 'id', category: 'Penyakit Paru' },
  { q: 'kesehatan masyarakat Indonesia', language: 'id', category: 'Kesehatan Masyarakat' },
  { q: 'tuberculosis treatment cure', language: 'en', category: 'Riset & Pengobatan' },
  { q: 'lung disease respiratory health', language: 'en', category: 'Penyakit Paru' },
  { q: 'vaksin imunisasi Indonesia', language: 'id', category: 'Vaksin & Imunisasi' },
];

const TBC_KEYWORDS = [
  'tbc', 'tuberkulosis', 'tuberculosis', 'tb paru', 'batuk kronis',
  'mycobacterium', 'oat obat', 'paru-paru', 'paru paru', 'pneumonia',
  'infeksi paru', 'kesehatan paru', 'imunisasi', 'vaksin bcg',
  'mdr-tb', 'resistansi obat', 'kemenkes', 'puskesmas', 'faskes',
  'penyakit menular', 'epidemi', 'pandemi', 'wabah', 'kesehatan',
];

function isRelevant(title = '', content = '') {
  const text = (title + ' ' + content).toLowerCase();
  return TBC_KEYWORDS.some((kw) => text.includes(kw));
}

function sanitizeText(text = '') {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function titleExists(title) {
  const normalized = title.trim().toLowerCase();
  const found = await prisma.article.findFirst({
    where: {
      title: {
        equals: normalized,
        mode: 'insensitive',
      },
    },
  });
  return !!found;
}

async function insertArticle(data) {
  const exists = await titleExists(data.title);
  if (exists) return false;

  await prisma.article.create({ data });
  return true;
}

async function fetchFromNewsApi() {
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY not set, skipping NewsAPI fetch.');
    return 0;
  }

  let total = 0;
  for (const query of NEWSAPI_QUERIES) {
    try {
      const url = new URL(`${NEWS_API_BASE}/everything`);
      url.searchParams.set('q', query.q);
      url.searchParams.set('language', query.language);
      url.searchParams.set('sortBy', 'publishedAt');
      url.searchParams.set('pageSize', '30');
      url.searchParams.set('apiKey', NEWS_API_KEY);

      const res = await fetch(url.toString());
      const json = await res.json();

      if (json.status !== 'ok') {
        console.warn(`NewsAPI error for "${query.q}":`, json.message);
        continue;
      }

      for (const item of (json.articles || [])) {
        if (!item.title || item.title === '[Removed]') continue;
        if (!isRelevant(item.title, item.description || '')) continue;

        const content = sanitizeText(item.content || item.description || '');
        const summary = sanitizeText(item.description || '').substring(0, 200);

        const inserted = await insertArticle({
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
      console.error(`NewsAPI fetch failed for "${query.q}":`, err.message);
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

        const inserted = await insertArticle({
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
      console.error(`RSS fetch failed for ${source.url}:`, err.message);
    }
  }

  return total;
}

async function main() {
  console.log('Clearing all existing articles from database...');
  const deleted = await prisma.article.deleteMany({});
  console.log(`Deleted ${deleted.count} existing articles.`);

  console.log('\nFetching articles from NewsAPI...');
  const newsApiCount = await fetchFromNewsApi();
  console.log(`NewsAPI: inserted ${newsApiCount} new articles.`);

  console.log('\nFetching articles from RSS feeds...');
  const rssCount = await fetchFromRss();
  console.log(`RSS feeds: inserted ${rssCount} new articles.`);

  const total = await prisma.article.count();
  console.log(`\nDone! Total articles in database: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
