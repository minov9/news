import { GoogleGenerativeAI } from '@google/generative-ai';
import { NewsItem } from './rss';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    genAI = new GoogleGenerativeAI(API_KEY);
  }
  return genAI;
}

export interface ProcessedNewsItem extends NewsItem {
  summary: string;
  keyPoints: string[];
}

export async function generateNewsSummary(news: NewsItem): Promise<ProcessedNewsItem> {
  const model = getGenAI().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  const contentToSummarize = news.contentSnippet || news.title;

  const prompt = `
You are an AI news editor. Summarize the following news about AI into 3-5 bullet points in Chinese.

Title: ${news.title}

Content: ${contentToSummarize}

Please return in this format (Chinese only):
- Point 1
- Point 2
- Point 3

Requirements:
1. Keep each point concise and clear
2. Stay objective and neutral
3. List only key points, no explanations
4. If content is too short, you can have less than 3 points
5. Maximum 5 points
6. No additional text or comments
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const keyPoints = parseKeyPoints(text);

    return {
      ...news,
      summary: news.contentSnippet?.substring(0, 200) || '',
      keyPoints,
    };
  } catch (error) {
    console.error(`Failed to generate summary for "${news.title}":`, error);

    // Fallback: return basic info
    return {
      ...news,
      summary: '',
      keyPoints: [
        news.title,
        ...(news.contentSnippet ? [news.contentSnippet.substring(0, 100) + '...'] : []),
      ],
    };
  }
}

function parseKeyPoints(text: string): string[] {
  const lines = text.split('\n').filter(line => line.trim());
  const points = lines
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(point => point.length > 0);

  if (points.length === 0) {
    return ['无法生成要点总结'];
  }

  return points.slice(0, 5);
}

export async function processAllNews(newsItems: NewsItem[]): Promise<ProcessedNewsItem[]> {
  console.log(`Processing ${newsItems.length} news items with AI...`);

  const processedNews: ProcessedNewsItem[] = [];

  for (let i = 0; i < newsItems.length; i++) {
    console.log(`  - [${i + 1}/${newsItems.length}] Processing: ${newsItems[i].title}`);
    const processed = await generateNewsSummary(newsItems[i]);
    processedNews.push(processed);

    // Add small delay to avoid rate limiting
    if (i < newsItems.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\n✓ Successfully processed ${processedNews.length} news items`);
  return processedNews;
}
