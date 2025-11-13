import * as https from 'https';
import FeedParser from 'feedparser';
import { Readable } from 'stream';

export interface NewsItem {
  title: string;
  link: string;
  sourceName: string;
  publishDate: string;
  contentSnippet?: string;
  summary?: string;
  keyPoints?: string[];
}

export interface NewsSource {
  name: string;
  url: string;
  type: 'tech' | 'company' | 'academic';
}

export const NEWS_SOURCES: NewsSource[] = [
  {
    name: '36Kr AI',
    url: 'https://36kr.com/feed/cat-all-ai',
    type: 'tech',
  },
  {
    name: '人人都是产品经理 AI',
    url: 'https://www.woshipm.com/feed',
    type: 'tech',
  },
  {
    name: '极客公园',
    url: 'https://www.geekpark.net/rss',
    type: 'tech',
  },
  {
    name: 'AI 科技评论',
    url: 'https://www.leiphone.com/category/ai/feed',
    type: 'tech',
  },
  {
    name: '机器之心',
    url: 'https://www.jiqizhixin.com/rss',
    type: 'tech',
  },
  {
    name: 'OpenAI Blog',
    url: 'https://openai.com/news/rss.xml',
    type: 'company',
  },
  {
    name: 'arXiv CS',
    url: 'http://export.arxiv.org/rss/cs.AI',
    type: 'academic',
  },
];

export async function parseRSSFeed(url: string): Promise<NewsItem[]> {
  return new Promise((resolve, reject) => {
    const newsItems: NewsItem[] = [];
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Use https.request for better control
    const options = new URL(url);
    const request = https.get(
      {
        hostname: options.hostname,
        path: options.pathname + options.search,
        port: options.port || (options.protocol === 'https:' ? 443 : 80),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DailyAINewsBot/1.0)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
        },
        timeout: 30000, // 30 second timeout
      },
      (response) => {
        if (response.statusCode !== 200) {
          console.warn(`Failed to fetch RSS from ${url}: HTTP ${response.statusCode}`);
          resolve([]);
          return;
        }

        const feedparser = new FeedParser({});

        feedparser.on('readable', function() {
          let item;
          while ((item = this.read())) {
            const pubDate = item.date || item.pubdate || item.published;

            // Skip items older than 24 hours
            if (pubDate && new Date(pubDate) < twentyFourHoursAgo) {
              continue;
            }

            const newsItem: NewsItem = {
              title: item.title || 'Untitled',
              link: item.link || '',
              sourceName: extractSourceName(url),
              publishDate: pubDate ? new Date(pubDate).toISOString() : '',
              contentSnippet: item.description || item.summary || '',
            };

            if (newsItem.link) {
              newsItems.push(newsItem);
            }
          }
        });

        feedparser.on('error', (error) => {
          console.warn(`FeedParser error for ${url}:`, error.message);
          resolve(newsItems);
        });

        feedparser.on('end', () => {
          resolve(newsItems);
        });

        // Pipe the response to feedparser
        response.pipe(feedparser);
      }
    );

    request.on('error', (error) => {
      console.warn(`Request error for ${url}:`, error.message);
      resolve([]);
    });

    request.on('timeout', () => {
      console.warn(`Request timeout for ${url}`);
      request.destroy();
      resolve([]);
    });
  });
}

function extractSourceName(url: string): string {
  try {
    if (url.includes('36kr.com')) return '36Kr';
    if (url.includes('woshipm.com')) return '人人都是产品经理';
    if (url.includes('geekpark.net')) return '极客公园';
    if (url.includes('leiphone.com')) return '雷锋网 AI科技评论';
    if (url.includes('jiqizhixin.com')) return '机器之心';
    if (url.includes('openai.com')) return 'OpenAI';
    if (url.includes('arxiv.org')) return 'arXiv';

    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown Source';
  }
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  console.log(`Fetching from ${NEWS_SOURCES.length} sources...`);

  const allNewsPromises = NEWS_SOURCES.map(async (source) => {
    console.log(`  - Fetching from ${source.name}...`);
    const news = await parseRSSFeed(source.url);
    console.log(`    ✓ Got ${news.length} items`);
    return news;
  });

  const allNewsArrays = await Promise.allSettled(allNewsPromises);
  const allNews = allNewsArrays
    .filter((result): result is PromiseFulfilledResult<NewsItem[]> =>
      result.status === 'fulfilled'
    )
    .map(result => result.value)
    .flat();

  // Sort by publish date (newest first)
  allNews.sort((a, b) => {
    const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
    const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
    return dateB - dateA;
  });

  // Limit to most recent 15 items to avoid overwhelming the AI
  const limitedNews = allNews.slice(0, 15);

  console.log(`\nTotal news items to summarize: ${limitedNews.length}`);
  return limitedNews;
}
