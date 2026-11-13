import { useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, Headphones, Play, PlayCircle } from 'lucide-react';
import { api } from '../../api/client';
import { useGet, useInvalidate, useMutate } from '../../api/hooks';
import type { LearningItemDetail, LearningItemRow } from '../../api/portalTypes';
import type { Paginated } from '../../api/types';
import { Card, PageHeader } from '../../components/Cards';
import { EmptyState, QueryState } from '../../components/Feedback';
import { Pagination } from '../../components/DataTable';
import { titleCase } from '../../lib/format';
import { Meter, SubjectIcon, pctOrDash } from './shared';
import './Learn.css';

interface LearningSubject {
  _id: string;
  code: string;
  name: string;
  icon?: string;
  description?: string;
  totalItems: number;
  completedItems: number;
  progressPercent: number | null;
}

type ContinueRow = LearningItemRow;

function lessonArtwork(it: LearningItemRow) {
  const subject = it.subjectId?.name?.toLowerCase() ?? '';
  if (/english|language|reading/.test(subject)) return '/assets/student-activities/english.jpg';
  if (/math|numeric/.test(subject)) return '/assets/student-activities/math.jpg';
  if (/science/.test(subject)) return '/assets/student-activities/science.jpg';
  if (/social|geography|history/.test(subject)) return '/assets/student-activities/globe.jpg';
  if (/practice|quiz/.test(it.type.toLowerCase())) return '/assets/student-activities/practice.jpg';
  return '/assets/student-activities/hero-illustration.png';
}

function classLevelsLabel(levels?: number[]) {
  if (!levels?.length) return '';
  const sorted = [...new Set(levels)].sort((a, b) => a - b);
  const continuous = sorted.every((level, index) => index === 0 || level === sorted[index - 1] + 1);
  return sorted.length > 2 && continuous
    ? `Classes ${sorted[0]}–${sorted[sorted.length - 1]}`
    : `Class${sorted.length > 1 ? 'es' : ''} ${sorted.join(', ')}`;
}

function ItemCard({ it, featured = false }: { it: LearningItemRow; featured?: boolean }) {
  const status = it.progress?.status;
  const action = status === 'completed' ? 'Review lesson' : it.progress ? 'Continue lesson' : 'Start lesson';
  return (
    <Link to={`/student/learn/items/${it._id}`} className={`learn-item ${featured ? 'learn-item--featured' : ''}`} aria-label={`${action}: ${it.title}`}>
      <span className="learn-item__art"><img src={lessonArtwork(it)} alt="" loading="lazy" /></span>
      <span className="learn-item__body">
        <span className="learn-item__subject">{it.subjectId?.name ?? titleCase(it.type)}</span>
        <strong className="learn-item__title">{it.title}</strong>
        {!featured && it.description && <span className="learn-item__description">{it.description}</span>}
        <span className="learn-item__meta">
          {titleCase(it.type)}{classLevelsLabel(it.classLevels) ? ` · ${classLevelsLabel(it.classLevels)}` : ''}
          {it.estimatedMinutes ? ` · ${it.estimatedMinutes} min` : ''}
        </span>
        {it.progress && <span className="learn-item__progress"><Meter value={it.progress.progressPct} label={`${it.title} progress`} tone="green" /><b>{Math.round(it.progress.progressPct)}%</b></span>}
        <span className="learn-item__footer">
          <span className="learn-item__action"><Play size={13} fill="currentColor" aria-hidden /> {action}</span>
          {status === 'completed' ? (
            <span className="learn-item__status learn-item__status--done"><CheckCircle2 size={13} aria-hidden /> Completed</span>
          ) : status ? (
            <span className="learn-item__status learn-item__status--progress">In progress</span>
          ) : (
            <span className="learn-item__status learn-item__status--new">New</span>
          )}
        </span>
      </span>
    </Link>
  );
}

export default function LearnPage() {
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'all' ? 'all' : 'mine';
  const subjectId = params.get('subjectId') ?? '';
  const page = Number(params.get('page') ?? 1) || 1;
  const subjects = useGet<LearningSubject[]>('/learning/subjects');
  const cont = useGet<ContinueRow[]>('/learning/continue');
  const items = useGet<Paginated<LearningItemRow>>('/learning/items', { view, subjectId: subjectId || undefined, page, pageSize: 12 });

  function set(next: Record<string, string>) {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    if (!('page' in next)) p.delete('page');
    setParams(p);
  }

  return (
    <div className="student-page learn-page">
      <section className="learn-hero" aria-labelledby="learn-heading">
        <img className="learn-hero__art" src="/assets/student-activities/hero.jpg" alt="" />
        <div className="learn-hero__copy">
          <span className="learn-eyebrow"><BookOpen size={15} aria-hidden /> YOUR LEARNING JOURNEY</span>
          <h1 id="learn-heading">Learn</h1>
          <p>Stories, concepts and activities for your class. Finish a lesson, then try its quick quiz.</p>
          <a className="learn-hero__button" href="#learn-lessons">Start learning <ArrowRight size={17} aria-hidden /></a>
        </div>
      </section>

      <QueryState query={cont} loadingLabel="Loading your continuing lessons…">
        {(rows) =>
          rows.length > 0 ? (
            <>
              <div className="learn-section-heading">
                <div><span className="learn-eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Continue learning</h2></div>
                <a href="#learn-lessons">View lessons <ArrowRight size={16} aria-hidden /></a>
              </div>
              <div className="learn-continue-grid">
                {rows.slice(0, 3).map((it) => (
                  <ItemCard key={it._id} it={it} featured />
                ))}
              </div>
            </>
          ) : null
        }
      </QueryState>

      <div className="learn-section-heading learn-subject-heading">
        <div><span className="learn-eyebrow">EXPLORE BY TOPIC</span><h2>Subjects</h2></div>
        <div className="learn-switch" role="radiogroup" aria-label="Which lessons">
          {([
            ['mine', 'My class'],
            ['all', 'All lessons'],
          ] as const).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={view === v} className={`learn-switch__button ${view === v ? 'is-active' : ''}`} onClick={() => set({ view: v })}>
              {v === 'mine' ? <CheckCircle2 size={15} aria-hidden /> : <BookOpen size={15} aria-hidden />}{l}
            </button>
          ))}
        </div>
      </div>
      <p className="learn-view-note">{view === 'mine' ? 'My class shows lessons you’ve started or completed.' : 'All published lessons for your class.'} Subject progress includes all lessons.</p>
      <QueryState query={subjects} loadingLabel="Loading subjects…">
        {(list) =>
          list.length === 0 ? (
            <EmptyState title="No subjects yet" />
          ) : (
            <div className="learn-subject-grid" role="group" aria-label="Filter by subject">
              <button type="button" className={`learn-subject learn-subject--all ${!subjectId ? 'is-active' : ''}`} aria-pressed={!subjectId} onClick={() => set({ subjectId: '' })}>
                <span className="learn-subject__icon"><BookOpen size={29} aria-hidden /></span>
                <span className="learn-subject__name">All subjects</span>
                <span className="learn-subject__count">{list.reduce((sum, s) => sum + s.completedItems, 0)} / {list.reduce((sum, s) => sum + s.totalItems, 0)} lessons</span>
                <Meter value={list.reduce((sum, s) => sum + s.totalItems, 0) ? list.reduce((sum, s) => sum + s.completedItems, 0) / list.reduce((sum, s) => sum + s.totalItems, 0) * 100 : null} label="All subjects progress" tone="green" />
              </button>
              {list.map((s) => (
                <button key={s._id} type="button" className={`learn-subject learn-subject--${(s.code || 'subject').toLowerCase().replace(/[^a-z0-9]+/g, '-')} ${subjectId === s._id ? 'is-active' : ''}`} aria-pressed={subjectId === s._id} onClick={() => set({ subjectId: s._id })}>
                  <span className="learn-subject__icon">
                    <SubjectIcon icon={s.icon} />
                  </span>
                  <span className="learn-subject__name">{s.name}</span>
                  <span className="learn-subject__count">{s.completedItems} / {s.totalItems} lessons</span>
                  <Meter value={s.progressPercent} label={`${s.name} progress`} tone="mango" />
                  <span className="learn-subject__percent">{pctOrDash(s.progressPercent)}</span>
                </button>
              ))}
            </div>
          )
        }
      </QueryState>

      <div className="learn-section-heading learn-lessons-heading" id="learn-lessons"><div><span className="learn-eyebrow">KEEP EXPLORING</span><h2>Lessons</h2></div></div>
      <QueryState query={items} loadingLabel="Loading lessons…">
        {(res) =>
          res.items.length === 0 ? (
            <EmptyState title="No lessons found" message={subjectId ? 'Try another subject or switch to “All lessons”.' : 'New lessons will appear here soon.'} />
          ) : (
            <>
              <div className="learn-lessons-grid">
                {res.items.map((it) => (
                  <ItemCard key={it._id} it={it} />
                ))}
              </div>
              <Pagination page={res.page} totalPages={res.totalPages} total={res.total} pageSize={res.pageSize} onPage={(p) => set({ page: String(p) })} />
            </>
          )
        }
      </QueryState>
    </div>
  );
}

export function LearningItemPage() {
  const { id = '' } = useParams();
  const q = useGet<LearningItemDetail & { quizId?: string }>(`/learning/items/${id}`, undefined, { placeholderData: undefined });
  const invalidate = useInvalidate();
  const opened = useRef<string | null>(null);
  const progress = useMutate((body: { progressPct?: number; completed?: boolean }) => api.post(`/learning/items/${id}/progress`, body), {
    invalidate: ['/learning', '/student'],
  });
  const complete = useMutate(() => api.post(`/learning/items/${id}/progress`, { completed: true }), {
    invalidate: ['/learning', '/student'],
    success: 'Lesson complete. Great work!',
  });

  // Record that the lesson was opened (once per item) so it shows under "Continue learning".
  useEffect(() => {
    const item = q.data;
    if (!item || opened.current === id) return;
    opened.current = id;
    if (!item.progress) progress.mutate({ progressPct: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data, id]);

  return (
    <div className="student-page student-page--narrow">
      <QueryState query={q} loadingLabel="Opening lesson…">
        {(it) => {
          const done = it.progress?.status === 'completed';
          return (
            <>
              <PageHeader
                title={it.title}
                subtitle={`${titleCase(it.type)} · ${it.subjectId?.name ?? ''}${it.estimatedMinutes ? ` · about ${it.estimatedMinutes} min` : ''}`}
                breadcrumb={
                  <Link to="/student/learn">
                    <ArrowLeft size={14} aria-hidden /> Learn
                  </Link>
                }
              />
              <Card>
                <div className="lesson">
                  {it.imageUrl && <img src={it.imageUrl} alt="" className="lesson__img" />}
                  {it.instructions && (
                    <p className="lesson__instructions">
                      <Clock size={14} aria-hidden /> {it.instructions}
                    </p>
                  )}
                  {it.audioUrl && (
                    <div className="lesson__audio">
                      <p className="small">
                        <Headphones size={14} aria-hidden /> Listen
                      </p>
                      <audio controls src={it.audioUrl} preload="none" onPlay={() => !done && progress.mutate({ progressPct: Math.max(50, it.progress?.progressPct ?? 0) })}>
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  )}
                  {it.body ? (
                    <div className="lesson__body">
                      {it.body.split(/\n{2,}/).map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                  ) : (
                    !it.audioUrl && <p className="muted">{it.description ?? 'This lesson has no text yet.'}</p>
                  )}
                </div>
                <div className="lesson__footer">
                  <div className="lesson__progress">
                    <Meter value={it.progress?.progressPct ?? 0} label="Lesson progress" tone="green" />
                    <span className="muted small">{done ? 'Completed' : `${it.progress?.progressPct ?? 0}% done`}</span>
                  </div>
                  <div className="row">
                    {done ? (
                      <span className="badge badge--green">
                        <CheckCircle2 size={12} aria-hidden /> Completed
                      </span>
                    ) : (
                      <button type="button" className="btn btn--primary" disabled={complete.isPending} onClick={() => complete.mutate(undefined)}>
                        <CheckCircle2 size={16} aria-hidden /> {complete.isPending ? 'Saving…' : 'Mark as complete'}
                      </button>
                    )}
                    {it.quiz && (
                      <Link className="btn btn--mango" to={`/student/quiz/${it.quiz.id}?back=${encodeURIComponent(`/student/learn/items/${id}`)}`} onClick={() => void invalidate('/learning')}>
                        <PlayCircle size={16} aria-hidden /> Take the quiz ({it.quiz.questionCount} questions)
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
