#!/usr/bin/env tsx

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { fetchAllNews } from '../lib/rss';
import { processAllNews } from '../lib/ai';
import * as fs from 'fs/promises';

async function main() {
  console.log('🚀 Daily AI News Generator\n');
  console.log(`Start time: ${new Date().toISOString()}\n`);

  try {
    // Step 1: Fetch news from RSS feeds
    console.log('📰 Step 1: Fetching news from RSS feeds...');
    const rawNews = await fetchAllNews();

    if (rawNews.length === 0) {
      console.warn('⚠️  No news found!');
      process.exit(1);
    }

    console.log(`✓ Found ${rawNews.length} news items\n`);

    // Step 2: Process with AI
    console.log('🤖 Step 2: Processing news with AI...');
    const processedNews = await processAllNews(rawNews);

    // Step 3: Save to data file
    console.log('\n💾 Step 3: Saving data...');
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // Ensure data directory exists
    await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });

    const data = {
      date: dateStr,
      generatedAt: today.toISOString(),
      news: processedNews,
    };

    const dataFile = path.join(process.cwd(), 'data', `news-${dateStr}.json`);
    await fs.writeFile(dataFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✓ Saved to ${dataFile}`);

    // Create latest.json for the web app
    const latestFile = path.join(process.cwd(), 'data', 'latest.json');
    await fs.writeFile(latestFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✓ Saved to ${latestFile}`);

    console.log('\n✅ All done!');
    console.log(`\nGenerated news for ${dateStr}:`);
    console.log(`- Total items: ${processedNews.length}`);
    console.log(`- Sources: ${new Set(processedNews.map(n => n.sourceName)).size}`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { main };
