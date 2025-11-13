import { promises as fs } from 'fs';
import path from 'path';
import { ProcessedNewsItem } from '@/lib/ai';

interface NewsData {
  date: string;
  generatedAt: string;
  news: ProcessedNewsItem[];
}

async function getLatestNews(): Promise<NewsData | null> {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const latestPath = path.join(dataDir, 'latest.json');

    const fileContents = await fs.readFile(latestPath, 'utf8');
    const data: NewsData = JSON.parse(fileContents);

    return data;
  } catch (error) {
    console.error('Failed to load news data:', error);
    return null;
  }
}

export const dynamic = 'force-static';

export default async function Home() {
  const newsData = await getLatestNews();

  if (!newsData) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Daily AI News</h1>
          <p className="text-[var(--text-secondary)] mb-8">正在加载最新AI新闻...</p>
          <p className="text-sm text-[var(--text-secondary)]">如果这是您的首次访问，请等待GitHub Actions生成今天的数据。</p>
          <p className="text-xs text-[var(--text-secondary)] mt-2">数据通常在每天上午7点（北京时间）更新</p>
        </div>
      </main>
    );
  }

  const { date, news } = newsData;
  const dateObj = new Date(date);
  const formattedDate = dateObj.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <div className="pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Daily AI News
          </span>
        </h1>
        <p className="text-xl text-[var(--text-secondary)]">每日AI资讯 · 智能总结</p>
        <div className="mt-4">
          <p className="text-sm text-[var(--text-secondary)]">{formattedDate}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="h-px bg-[var(--border-color)] mb-12"></div>
      </div>

      {/* News List */}
      <div className="max-w-3xl mx-auto px-4 pb-32">
        {news.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-[var(--text-secondary)]">暂无今日新闻</p>
          </div>
        ) : (
          <div className="space-y-12">
            {news.map((article, index) => (
              <article
                key={`${article.title}-${index}`}
                className="glass-card p-8 animate-fade-in-up"
                style={{
                  animationDelay: `${index * 0.1}s` as any,
                }}
              >
                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-semibold mb-4 leading-tight">
                  {article.title}
                </h2>

                {/* Key Points */}
                <div className="mb-6">
                  <ul className="space-y-3">
                    {article.keyPoints.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex items-start gap-3">
                        <span className="text-[var(--accent-color)] text-xl leading-none">•</span>
                        <p className="text-lg leading-relaxed text-[var(--text-primary)]">
                          {point}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Source Link */}
                <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-hover"
                  >
                    阅读全文
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>
                  <span className="mx-3 text-[var(--text-secondary)]">·</span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {article.sourceName}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto px-4 pt-16 pb-8 text-center">
        <div className="h-px bg-[var(--border-color)] mb-8"></div>
        <p className="text-sm text-[var(--text-secondary)]">
          © 2025 Daily AI News
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          自动更新于每天上午7点（北京时间）
        </p>
      </footer>
    </main>
  );
}
