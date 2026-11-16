import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Atom, BookOpen, BriefcaseBusiness, CheckCircle2, Cpu, Crown, FlaskConical, GraduationCap, HeartPulse, Lock, PlayCircle, Sparkles, Star, Trophy, UserRound } from 'lucide-react';
import { ERROR_CODES } from '@mango/shared';
import { ApiError, api } from '../../api/client';
import { useGet, useMutate } from '../../api/hooks';
import type { ProgrammeDetail, StudentProgramme } from '../../api/portalTypes';
import { Card, PageHeader } from '../../components/Cards';
import { EmptyState, QueryState } from '../../components/Feedback';
import { date, titleCase } from '../../lib/format';
import { Meter, SectionTitle, lockText } from './shared';
import './Programmes.css';

type ProgrammeTheme = 'science' | 'health' | 'chess' | 'business' | 'technology' | 'sports' | 'learning';

function programmeTheme(p: StudentProgramme): ProgrammeTheme {
  const key = `${p.code} ${p.name}`.toLowerCase();
  if (/science|scientist|experiment|lab/.test(key)) return 'science';
  if (/health|medical|wellness/.test(key)) return 'health';
  if (/chess|strategy/.test(key)) return 'chess';
  if (/entrepreneur|business|finance/.test(key)) return 'business';
  if (/ai|computer|tech|robot/.test(key)) return 'technology';
  if (/sport|fitness/.test(key)) return 'sports';
  return 'learning';
}

function ProgrammeArt({ p }: { p: StudentProgramme }) {
  const theme = programmeTheme(p);
  const ArtIcon = ({
    science: FlaskConical,
    health: HeartPulse,
    chess: Trophy,
    business: BriefcaseBusiness,
    technology: Cpu,
    sports: Star,
    learning: BookOpen,
  })[theme];
  return (
    <div className={`programme-card__art programme-card__art--${theme}`} aria-hidden="true">
      <span className="programme-card__art-orbit" />
      <span className="programme-card__art-symbol"><ArtIcon size={58} strokeWidth={1.7} /></span>
      <span className="programme-card__art-spark programme-card__art-spark--one">✦</span>
      <span className="programme-card__art-spark programme-card__art-spark--two">✦</span>
      {theme === 'science' && <span className="programme-card__flask programme-card__flask--two"><Atom size={34} /></span>}
      {theme === 'technology' && <span className="programme-card__chip">AI</span>}
      {theme === 'chess' && <span className="programme-card__chess-piece">♞</span>}
    </div>
  );
}

function ProgrammeCard({ p, featured = false }: { p: StudentProgramme; featured?: boolean }) {
  const inner = (
    <>
      <div className="programme-card__head">
        {p.premium ? (
          <span className="gold-badge">
            <Crown size={12} aria-hidden /> Premium academy
          </span>
        ) : (
          <span className="badge badge--green">
            <Sparkles size={12} aria-hidden /> Programme
          </span>
        )}
        {p.locked && (
          <span className="badge badge--grey">
            <Lock size={12} aria-hidden /> Locked
          </span>
        )}
      </div>
      <h3>{p.name}</h3>
      {p.description && <p className="muted small">{p.description}</p>}
      <p className="muted small">
        {p.moduleCount} module{p.moduleCount === 1 ? '' : 's'}
        {p.validUntil && !p.locked ? ` · available until ${date(p.validUntil)}` : ''}
      </p>
      {p.locked ? (
        <p className="small programme-card__lock">
          <Lock size={14} aria-hidden /> {lockText(p.lockReason)}
        </p>
      ) : p.enrolment ? (
        <>
          <Meter value={p.enrolment.progressPercent} label={`${p.name} progress`} tone={p.premium ? 'gold' : 'green'} />
          <p className="small">{p.enrolment.completed ? 'Completed — well done!' : `${Math.round(p.enrolment.progressPercent)}% complete`}</p>
          <span className="btn btn--mango btn--sm">Continue</span>
        </>
      ) : (
        <span className="btn btn--secondary btn--sm">Explore</span>
      )}
    </>
  );
  // Locked cards are not links, so their module content is never requested.
  return p.locked ? (
    <article className={`programme-card programme-card--${programmeTheme(p)} ${featured ? 'programme-card--featured' : ''} is-locked ${p.premium ? 'programme-card--premium' : ''}`} aria-label={`${p.name} (locked)`}>
      <ProgrammeArt p={p} />
      {inner}
    </article>
  ) : (
    <Link to={`/student/programmes/${p.id}`} className={`programme-card programme-card--${programmeTheme(p)} ${featured ? 'programme-card--featured' : ''} ${p.premium ? 'programme-card--premium' : ''}`}>
      <ProgrammeArt p={p} />
      {inner}
    </Link>
  );
}

export default function ProgrammesPage() {
  const q = useGet<{ premiumAcademies: StudentProgramme[]; otherProgrammes: StudentProgramme[] }>('/programmes');
  const [view, setView] = useState<'all' | 'mine'>('all');
  return (
    <div className="student-page student-programmes-page">
      <div className="programmes-hero">
        <span className="programmes-hero__icon"><GraduationCap size={38} aria-hidden /></span>
        <PageHeader title="Programmes" subtitle="Enrichment programmes your school has unlocked for you." />
        <div className="programmes-hero__art" aria-hidden="true">
          <span className="programmes-hero__book programmes-hero__book--one" />
          <span className="programmes-hero__book programmes-hero__book--two" />
          <GraduationCap className="programmes-hero__cap" size={126} />
          <span className="programmes-hero__leaf programmes-hero__leaf--one" />
          <span className="programmes-hero__leaf programmes-hero__leaf--two" />
          <span className="programmes-hero__spark">✦</span>
        </div>
      </div>
      <div className="programmes-tabs seg seg--sm" role="radiogroup" aria-label="Programme filter">
        {(
          [
            ['all', 'All programmes'],
            ['mine', 'My programmes'],
          ] as const
        ).map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={view === v} className={`seg__btn ${view === v ? 'seg__btn--active' : ''}`} onClick={() => setView(v)}>
            {v === 'all' ? <Star size={17} aria-hidden /> : <UserRound size={17} aria-hidden />}
            {l}
          </button>
        ))}
      </div>
      <QueryState query={q} loadingLabel="Loading programmes…">
        {(d) => {
          const filter = (list: StudentProgramme[]) => (view === 'mine' ? list.filter((p) => p.enrolment) : list);
          const others = filter(d.otherProgrammes);
          const premium = filter(d.premiumAcademies);
          if (view === 'mine' && others.length + premium.length === 0) {
            return (
              <EmptyState
                title="No programmes joined yet"
                message="Explore the catalogue and enrol to see your programmes here."
                action={
                  <button type="button" className="btn btn--secondary" onClick={() => setView('all')}>
                    Browse all programmes
                  </button>
                }
              />
            );
          }
          return (
            <>
              <SectionTitle>Young Scientist & more</SectionTitle>
              {others.length === 0 ? (
                <EmptyState title="No programmes yet" />
              ) : (
                <div className="programme-grid">
                  {others.map((p, index) => (
                    <ProgrammeCard key={p.id} p={p} featured={index === 0} />
                  ))}
                </div>
              )}
              <SectionTitle>
                <Crown size={18} aria-hidden className="text-gold" /> Premium academies
              </SectionTitle>
              {premium.length === 0 ? (
                <EmptyState title="No premium academies" />
              ) : (
                <div className="programme-grid">
                  {premium.map((p) => (
                    <ProgrammeCard key={p.id} p={p} />
                  ))}
                </div>
              )}
            </>
          );
        }}
      </QueryState>
    </div>
  );
}

export function ProgrammeDetailPage() {
  const { id = '' } = useParams();
  const q = useGet<ProgrammeDetail>(`/programmes/${id}`, undefined, { placeholderData: undefined, retry: (n, e) => !(e instanceof ApiError && e.status === 403) && n < 2 });
  const enrol = useMutate(() => api.post(`/programmes/${id}/enrolments`), { invalidate: ['/programmes', '/student'], success: 'You’re enrolled. Have fun!' });
  const complete = useMutate((itemId: string) => api.post(`/programmes/${id}/items/${itemId}/complete`), { invalidate: ['/programmes', '/student'], success: 'Item completed.' });

  if (q.isError && q.error instanceof ApiError && (q.error.code === ERROR_CODES.PROGRAMME_LOCKED || q.error.status === 403)) {
    return (
      <div className="student-page student-page--narrow student-programme-detail">
        <EmptyState
          title="This programme is locked"
          message={q.error.message}
          action={
            <Link to="/student/programmes" className="btn btn--secondary">
              Back to programmes
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="student-page student-page--narrow student-programme-detail">
      <QueryState query={q} loadingLabel="Loading programme…">
        {(p) => {
          const items = p.modules.flatMap((m) => m.items);
          const doneCount = items.filter((i) => i.completed).length;
          return (
            <>
              <PageHeader
                title={p.name}
                subtitle={p.description}
                breadcrumb={
                  <Link to="/student/programmes">
                    <ArrowLeft size={14} aria-hidden /> Programmes
                  </Link>
                }
                actions={
                  p.premium ? (
                    <span className="gold-badge">
                      <Crown size={12} aria-hidden /> Premium academy
                    </span>
                  ) : undefined
                }
              />
              {!p.enrolment ? (
                <Card>
                  <div className="row row--between">
                    <p>
                      {p.modules.length} modules · {items.length} items. Enrol to start tracking your progress.
                    </p>
                    <button type="button" className="btn btn--mango" disabled={enrol.isPending} onClick={() => enrol.mutate(undefined)}>
                      {enrol.isPending ? 'Enrolling…' : 'Enrol now'}
                    </button>
                  </div>
                </Card>
              ) : (
                <Card>
                  <p className="small">
                    {doneCount} of {items.length} items done · {Math.round(p.enrolment.progressPct ?? 0)}% of required items
                    {p.enrolment.completedAt ? ` · completed ${date(p.enrolment.completedAt)}` : ''}
                  </p>
                  <Meter value={p.enrolment.progressPct ?? 0} label="Programme progress" tone={p.premium ? 'gold' : 'green'} />
                </Card>
              )}
              {p.modules.length === 0 && <EmptyState title="No modules yet" />}
              {p.modules.map((m, mi) => (
                <Card key={m._id} title={`Module ${mi + 1}: ${m.title}`} subtitle={m.description}>
                  <ol className="programme-items">
                    {m.items.map((it) => (
                      <li key={it._id} className={it.completed ? 'is-done' : ''}>
                        <div className="programme-items__head">
                          <strong>{it.title}</strong>
                          <span className="muted small">
                            {titleCase(it.type)}
                            {it.required === false ? ' · optional' : ''}
                          </span>
                          {it.completed && (
                            <span className="badge badge--green">
                              <CheckCircle2 size={12} aria-hidden /> Done
                            </span>
                          )}
                        </div>
                        {it.content && <p className="muted small">{it.content}</p>}
                        {p.enrolment && !it.completed && (
                          <div className="row">
                            {it.quizId && (
                              <Link className="btn btn--secondary btn--sm" to={`/student/quiz/${it.quizId}?back=${encodeURIComponent(`/student/programmes/${id}`)}`}>
                                <PlayCircle size={14} aria-hidden /> Take item quiz
                              </Link>
                            )}
                            <button type="button" className="btn btn--mango btn--sm" disabled={complete.isPending} onClick={() => complete.mutate(it._id)}>
                              Mark complete
                            </button>
                          </div>
                        )}
                        {it.quizId && !it.completed && p.enrolment && <p className="muted small">Finish the item quiz first, then mark it complete.</p>}
                      </li>
                    ))}
                  </ol>
                </Card>
              ))}
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
