import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Cpu,
  FlaskConical,
  Globe2,
  HeartPulse,
  Leaf,
  Newspaper,
  PlayCircle,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { useGet } from '../../api/hooks';
import type { NewsCategory, NewsDetail, NewsRow } from '../../api/portalTypes';
import type { Paginated } from '../../api/types';
import { Card, PageHeader } from '../../components/Cards';
import { EmptyState, QueryState } from '../../components/Feedback';
import { Pagination } from '../../components/DataTable';
import { date } from '../../lib/format';
import './News.css';

type Row = NewsRow & { publishAt?: string; quizId?: string | null; featured?: boolean };

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  NATIONAL: Newspaper,
  INTERNATIONAL: Globe2,
  SCIENCE_SPACE: FlaskConical,
  TECH_AI: Cpu,
  SPORTS_ENT: Trophy,
  ENVIRONMENT: Leaf,
  BUSINESS: BarChart3,
  HEALTH_SOCIETY: HeartPulse,
};

function categoryClass(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export default function NewsPage() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') ?? '';
  const page = Number(params.get('page') ?? 1) || 1;
  const cats = useGet<NewsCategory[]>('/news/categories');
  const list = useGet<Paginated<Row>>('/news', { category: category || undefined, page, pageSize: 10 });
  const catName = (code: string) => cats.data?.find((c) => c.code === code)?.name ?? code;

  return (
    <div className="student-page student-news-page">
      <div className="student-news-intro">
        <span className="student-news-intro__mark" aria-hidden="true"><Newspaper size={28} /></span>
        <PageHeader title="News & GK" subtitle="Short, age-appropriate stories from around the world — with quick quizzes." />
        <span className="student-news-intro__art" aria-hidden="true"><BookOpen size={72} /><Globe2 size={58} /></span>
      </div>
      <QueryState query={cats}>
        {(cs) => (
          <div className="chip-row" role="group" aria-label="News categories">
            <button type="button" className={`chip ${!category ? 'chip--active' : ''}`} aria-pressed={!category} onClick={() => setParams({})}>
              All
            </button>
            {cs.map((c) => {
              const Icon = CATEGORY_ICONS[c.code] ?? Newspaper;
              return (
                <button key={c.code} type="button" className={`chip ${category === c.code ? 'chip--active' : ''}`} aria-pressed={category === c.code} onClick={() => setParams({ category: c.code })}>
                  <Icon className="student-news-chip__icon" size={16} aria-hidden />
                  {c.name} <span className="chip__count">{c.articleCount}</span>
                </button>
              );
            })}
          </div>
        )}
      </QueryState>
      <QueryState query={list} loadingLabel="Loading news…">
        {(res) =>
          res.items.length === 0 ? (
            <EmptyState title="No stories here yet" message="Check back soon for new articles." />
          ) : (
            <>
              {(() => {
                const featured = res.items.find((article) => article.featured) ?? res.items[0];
                const Icon = CATEGORY_ICONS[featured.category] ?? Newspaper;
                const FeaturedArtIcon = featured.category === 'SCIENCE_SPACE' ? Globe2 : Icon;
                const articles = res.items.filter((article) => article._id !== featured._id);
                return (
                  <>
                    <Link
                      to={`/student/news/${featured._id}`}
                      className={`news-featured news-featured--${categoryClass(featured.category)}`}
                    >
                      {featured.imageUrl ? (
                        <img className="news-featured__image" src={featured.imageUrl} alt="" />
                      ) : (
                        <span className="news-featured__art" aria-hidden="true"><FeaturedArtIcon size={176} strokeWidth={0.8} /></span>
                      )}
                      <span className="news-featured__shade" aria-hidden="true" />
                      <span className="news-featured__date">{date(featured.publishAt ?? featured.publishedAt)}</span>
                      <span className="news-featured__copy">
                        <span className="news-featured__cat"><Icon size={16} aria-hidden /> {catName(featured.category)}</span>
                        <strong className="news-featured__title">{featured.title}</strong>
                        {featured.summary && <span className="news-featured__summary">{featured.summary}</span>}
                        {featured.quizId && <span className="news-featured__quiz">· has a quiz</span>}
                      </span>
                      <span className="news-featured__action" aria-hidden="true"><ArrowRight size={22} /></span>
                    </Link>
                    <div className="news-grid">
                      {articles.map((n) => {
                        const ArticleIcon = CATEGORY_ICONS[n.category] ?? Newspaper;
                        return (
                          <Link key={n._id} to={`/student/news/${n._id}`} className={`news-card news-card--${categoryClass(n.category)}`}>
                            {n.imageUrl ? (
                              <img className="news-card__image" src={n.imageUrl} alt="" loading="lazy" />
                            ) : (
                              <span className="news-card__art" aria-hidden="true"><ArticleIcon size={42} strokeWidth={1.5} /></span>
                            )}
                            <span className="news-card__body">
                              <span className="news-card__cat">{catName(n.category)}</span>
                              <strong className="news-card__title">{n.title}</strong>
                              {n.summary && <span className="muted small news-card__summary">{n.summary}</span>}
                              <span className="muted small news-card__meta">
                                {date(n.publishAt ?? n.publishedAt)}
                                {n.quizId ? ' · has a quiz' : ''}
                              </span>
                            </span>
                            <span className="news-card__arrow" aria-hidden="true"><ArrowRight size={17} /></span>
                          </Link>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
              <Pagination page={res.page} totalPages={res.totalPages} total={res.total} pageSize={res.pageSize} onPage={(p) => setParams(category ? { category, page: String(p) } : { page: String(p) })} />
            </>
          )
        }
      </QueryState>
    </div>
  );
}

export function NewsArticlePage() {
  const { id = '' } = useParams();
  const q = useGet<NewsDetail & { publishAt?: string }>(`/news/${id}`, undefined, { placeholderData: undefined });
  const cats = useGet<NewsCategory[]>('/news/categories');
  return (
    <div className="student-page student-page--narrow">
      <QueryState query={q} loadingLabel="Loading article…">
        {(a) => (
          <>
            <PageHeader
              title={a.title}
              subtitle={`${cats.data?.find((c) => c.code === a.category)?.name ?? a.category} · ${date(a.publishAt ?? a.publishedAt)}`}
              breadcrumb={
                <Link to={`/student/news?category=${a.category}`}>
                  <ArrowLeft size={14} aria-hidden /> News & GK
                </Link>
              }
            />
            <Card>
              <article className="lesson">
                {a.imageUrl && <img src={a.imageUrl} alt="" className="lesson__img" />}
                {a.summary && <p className="lesson__lead">{a.summary}</p>}
                <div className="lesson__body">
                  {(a.body ?? '').split(/\n{2,}/).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {a.source && <p className="muted small">Source: {a.source}</p>}
              </article>
              {a.quiz && (
                <div className="lesson__footer">
                  <span className="muted">Test what you learned.</span>
                  <Link className="btn btn--mango" to={`/student/quiz/${a.quiz.id}?back=${encodeURIComponent(`/student/news/${id}`)}`}>
                    <PlayCircle size={16} aria-hidden /> Take the quiz ({a.quiz.questionCount} questions)
                  </Link>
                </div>
              )}
            </Card>
          </>
        )}
      </QueryState>
    </div>
  );
}
