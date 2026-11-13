import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BookOpen, ClipboardList, Flame, Gamepad2, Lightbulb, PlayCircle, Star, Target, TrendingUp } from 'lucide-react';
import { useGet } from '../../api/hooks';
import type { StudentActivity, StudentHome as Home, StudentProgress } from '../../api/portalTypes';
import { EmptyState, ErrorState, Loading, QueryState } from '../../components/Feedback';
import { date, dateTime } from '../../lib/format';
import { ACTIVITY_TYPE_LABEL, Avatar, Meter, SectionTitle, SubjectIcon, greeting, pctOrDash } from './shared';
import './StudentHome.css';

const HOME_FONTS = ['700 1em Nunito', '800 1em Nunito', '900 1em Nunito', '400 1em Inter', '500 1em Inter', '600 1em Inter', '700 1em Inter'];

const QUICK = [
  { to: '/student/activities', label: 'My Activities', description: 'Continue where you left off', icon: BookOpen, tone: 'activities' },
  { to: '/student/learn', label: 'Learn', description: 'Explore new concepts', icon: Lightbulb, tone: 'learn' },
  { to: '/student/games', label: 'Games', description: 'Play & Learn', icon: Gamepad2, tone: 'games' },
  { to: '/student/certificates', label: 'Certificates', description: 'Earn your rewards', icon: Award, tone: 'certificates' },
  { to: '/student/progress', label: 'My Progress', description: 'Track your growth', icon: TrendingUp, tone: 'progress' },
];

function subjectTheme(code?: string, name?: string): string {
  const key = `${code || ''} ${name || ''}`.toLowerCase();
  if (key.includes('math')) return 'math';
  if (key.includes('sci')) return 'science';
  if (key.includes('eng')) return 'english';
  if (key.includes('comp') || key.includes('ai') || key.includes('cpu')) return 'ai';
  if (key.includes('sport') || key.includes('pe') || key.includes('gym')) return 'sports';
  if (key.includes('social') || key.includes('sst') || key.includes('hist') || key.includes('geo')) return 'social';
  return 'default';
}

export function activityLink(a: Pick<StudentActivity, '_id' | 'type' | 'quizId'>): string {
  if (a.type === 'quiz' && a.quizId) return `/student/quiz/${a.quizId._id}?activityId=${a._id}`;
  return '/student/activities';
}

function LearningOverview({ learningPercent }: { learningPercent: number | null }) {
  const progress = useGet<StudentProgress>('/student/progress', { range: 'all' });
  return (
    <QueryState query={progress} loadingLabel="Loading your progress…">
      {(p) => {
        const value = p.overall.averagePercent;
        const circumference = 2 * Math.PI * 62;
        const categories = [
          { label: 'Activities', value: p.activityCompletion?.ratePercent, tone: 'activities', description: 'Assigned activity completion' },
          { label: 'Quizzes', value: p.overall.quizAccuracyPercent, tone: 'quizzes', description: 'All-time quiz accuracy' },
          { label: 'Games', value: null, tone: 'games', description: 'A Games percentage is not provided by the existing API' },
          { label: 'Learning', value: learningPercent, tone: 'learning', description: 'Completed lessons across your subjects' },
        ];
        return (
          <>
            <div className="student-home-progress-body">
              <div className="student-home-ring">
                <svg viewBox="0 0 150 150" role="progressbar" aria-label="All-time quiz and assessment score" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value ?? undefined} aria-valuetext={value == null ? 'No assessment score yet' : pctOrDash(value)}>
                  <circle cx="75" cy="75" r="62" className="student-home-ring__track" />
                  <circle cx="75" cy="75" r="62" className="student-home-ring__value" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - (value ?? 0) / 100)} />
                </svg>
                <strong>{pctOrDash(value)}</strong><span>Overall Progress</span>
              </div>
              <ul className="student-home-legend">
                {categories.map((category) => <li key={category.label} title={category.description}><span className={`student-home-dot student-home-dot--${category.tone}`} aria-hidden /><span>{category.label}</span><b>{pctOrDash(category.value)}</b></li>)}
              </ul>
            </div>
            <p className="student-home-score-note">All-time quiz &amp; assessment score</p>
            <div className="student-home-encouragement"><Star size={22} aria-hidden /><span>Excellent! Keep up the great work!</span></div>
          </>
        );
      }}
    </QueryState>
  );
}

export default function StudentHome() {
  const home = useGet<Home>('/student/home');
  const pending = useGet<StudentActivity[]>('/student/activities', { status: 'pending' });
  const [fontState, setFontState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    Promise.all(HOME_FONTS.map((font) => document.fonts.load(font))).then(
      () => { if (active) setFontState('ready'); },
      () => { if (active) setFontState('error'); },
    );
    return () => { active = false; };
  }, []);

  if (fontState !== 'ready') {
    return (
      <div className="student-page student-home" aria-busy={fontState === 'loading'}>
        {fontState === 'loading' ? (
          <Loading label="Preparing your dashboard…" />
        ) : (
          <ErrorState title="Could not load dashboard fonts" error={new Error('Check your connection and try again.')} onRetry={() => window.location.reload()} />
        )}
      </div>
    );
  }

  return (
    <QueryState query={home} loadingLabel="Getting your day ready…">
      {(h) => {
        const done = h.dailyProgress.quizzes + h.dailyProgress.learningItems + h.dailyProgress.games;
        const goal = h.dailyProgress.dailyGoal || 3;
        const certCount = Array.isArray(h.certification.certificates) ? h.certification.certificates.length : h.certification.certificates;
        const totalLessons = h.subjects.reduce((total, subject) => total + subject.totalItems, 0);
        const completedLessons = h.subjects.reduce((total, subject) => total + subject.completedItems, 0);
        return (
          <div className="student-page student-home">
            <section className="student-home-hero" aria-labelledby="student-home-hero-title">
              <img className="student-home-hero__scene" src="/assets/student-home/hero-scene.png" width="1337" height="272" alt="" fetchPriority="high" />
              <div className="student-home-hero__copy">
                <h1 id="student-home-hero-title">Dream Big,<br /><span>Learn More!</span></h1>
                <p>Explore <span aria-hidden>•</span> Learn <span aria-hidden>•</span> Grow</p>
                <Link to="/student/learn" className="student-home-button student-home-button--mango">Start Learning <ArrowRight size={18} aria-hidden /></Link>
              </div>
              <div className="student-home-hero__mobile-art" aria-hidden="true"><img src="/assets/student-home/student-scene.png" width="360" height="272" alt="" /><img src="/assets/student-home/trophy-scene.png" width="561" height="272" alt="" /></div>
            </section>
            <nav className="student-home-shortcuts" aria-label="Quick links">
              {QUICK.map((q) => <Link key={q.to} to={q.to} className={`student-home-shortcut student-home-shortcut--${q.tone}`}><q.icon size={44} strokeWidth={2.3} aria-hidden /><h2>{q.label}</h2><p>{q.description}</p></Link>)}
            </nav>
            <div className="student-home-panels">
              <section className="student-home-panel student-home-panel--progress" aria-labelledby="student-home-progress-title">
                <div className="student-home-panel__heading"><h2 id="student-home-progress-title">Your Learning Progress</h2><Link to="/student/progress">View Details <ArrowRight size={17} aria-hidden /></Link></div>
                <LearningOverview learningPercent={totalLessons ? completedLessons / totalLessons * 100 : null} />
              </section>
              <section className="student-home-panel student-home-panel--upcoming" aria-labelledby="student-home-upcoming-title">
                <div className="student-home-panel__heading"><h2 id="student-home-upcoming-title">Upcoming Activities</h2><Link to="/student/activities">View All <ArrowRight size={17} aria-hidden /></Link></div>
                <QueryState query={pending}>
                  {(list) => list.length === 0 ? <EmptyState title="All caught up!" message="You have no pending activities from your teachers." /> : (
                    <ul className="student-home-activities">
                      {list.slice(0, 4).map((a, index) => {
                        const Icon = a.type === 'quiz' ? ClipboardList : BookOpen;
                        return <li key={a._id}><span className={`student-home-activity-icon student-home-activity-icon--${index % 3}`}><Icon size={26} aria-hidden /></span><div className="student-home-activity-copy"><h3><Link to={activityLink(a)}>{a.title}</Link></h3><p>Due {dateTime(a.dueAt)}</p><span className="sr-only">{ACTIVITY_TYPE_LABEL[a.type]} · {a.subjectId?.name}</span>{a.overdue && <span className="badge badge--red">Overdue</span>}</div><Link to={activityLink(a)} className="student-home-button student-home-button--small" aria-label={`Start ${a.title}`}>Start</Link></li>;
                      })}
                    </ul>
                  )}
                </QueryState>
              </section>
              <section className="student-home-achievement"><img src="/assets/student-home/achievement-medal.png" width="345" height="167" alt="" /><div className="student-home-achievement__copy"><h2>You’re on the right track!</h2><p>Keep learning and achieve more.</p><Link to="/student/progress" className="student-home-button">View Progress <ArrowRight size={18} aria-hidden /></Link></div></section>
            </div>
            <section className="student-home-personal" aria-label="My learning details">
            <section className="student-hero">
              <Avatar avatar={h.student.avatar} name={h.student.displayName || h.student.name} size="lg" />
              <div className="student-hero__text">
                <p className="student-hero__hello">{greeting()},</p>
                <h2>{h.student.displayName || h.student.name}</h2>
                <p className="muted">
                  {h.student.className} · {h.student.schoolName} · ID {h.student.studentCode}
                </p>
              </div>
              {h.certification.currentLevel > 0 ? (
                <span className="cert-chip" title={`${certCount} certificate${certCount === 1 ? '' : 's'}`}>
                  <Award size={16} aria-hidden /> Level {h.certification.currentLevel} certified
                </span>
              ) : (
                <Link to="/student/certificates" className="cert-chip cert-chip--muted">
                  <Award size={16} aria-hidden /> Not certified yet
                </Link>
              )}
            </section>

            <div className="student-stats">
              <div className="student-stat">
                <Target size={22} aria-hidden />
                <div>
                  <p className="student-stat__label">Today’s goal ({date(h.dailyProgress.date)})</p>
                  <p className="student-stat__value">
                    {Math.min(done, goal)} / {goal}
                  </p>
                  <Meter value={(Math.min(done, goal) / goal) * 100} label="Daily goal progress" tone="mango" />
                  <p className="muted small">
                    {plural(h.dailyProgress.learningItems, 'lesson')} · {plural(h.dailyProgress.quizzes, 'quiz', 'quizzes')} · {plural(h.dailyProgress.games, 'game')}
                  </p>
                </div>
              </div>
              <div className="student-stat">
                <Flame size={22} aria-hidden className="text-mango" />
                <div>
                  <p className="student-stat__label">Learning streak</p>
                  <p className="student-stat__value">
                    {h.streak.current} day{h.streak.current === 1 ? '' : 's'}
                  </p>
                  <p className="muted small">{h.streak.activeToday ? 'You learned today — keep it going!' : 'Learn something today to keep your streak.'}</p>
                </div>
              </div>
              <div className="student-stat">
                <ClipboardList size={22} aria-hidden />
                <div>
                  <p className="student-stat__label">Pending activities</p>
                  <p className="student-stat__value">{h.pendingActivities}</p>
                  <Link to="/student/activities" className="small">
                    See my activities
                  </Link>
                </div>
              </div>
            </div>

            {h.continueLearning && (
              <Link to={`/student/learn/items/${h.continueLearning.id}`} className="continue-card">
                <PlayCircle size={32} aria-hidden />
                <div>
                  <p className="student-stat__label">Continue learning</p>
                  <p className="continue-card__title">{h.continueLearning.title}</p>
                  <Meter value={h.continueLearning.progressPct} label={`${h.continueLearning.title} progress`} tone="green" />
                </div>
                <span className="muted small">{h.continueLearning.progressPct}%</span>
              </Link>
            )}

            <SectionTitle
              action={
                <Link to="/student/learn" className="student-home-subjects-all">
                  All subjects <ArrowRight size={14} aria-hidden />
                </Link>
              }
            >
              My subjects
            </SectionTitle>
            {h.subjects.length === 0 ? (
              <EmptyState title="No subjects yet" message="Your subjects will appear here once your school sets up your class." />
            ) : (
              <div className="subject-grid">
                {h.subjects.map((s) => {
                  const theme = subjectTheme(s.code, s.name);
                  return (
                    <Link
                      key={s.id}
                      to={`/student/learn?subjectId=${s.id}`}
                      className={`subject-card subject-card--${theme}`}
                    >
                      <div className="subject-card__header">
                        <span className="subject-card__icon">
                          <SubjectIcon icon={s.icon} size={20} />
                        </span>
                        <span className="subject-card__arrow" aria-hidden="true">
                          <ArrowRight size={13} />
                        </span>
                      </div>
                      <div className="subject-card__body">
                        <span className="subject-card__name">{s.name}</span>
                        <div className="subject-card__meta">
                          <span className="subject-card__lessons">
                            {s.completedItems} of {s.totalItems} lessons
                          </span>
                          <span className="subject-card__pct">
                            {pctOrDash(s.progressPercent)}
                          </span>
                        </div>
                        <div className="subject-card__progress">
                          <Meter
                            value={s.progressPercent}
                            label={`${s.name} progress`}
                            tone={s.progressPercent && s.progressPercent >= 100 ? 'green' : 'mango'}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <nav className="student-home-more-links" aria-label="More student links"><Link to="/student/news">News &amp; GK <ArrowRight size={16} aria-hidden /></Link><Link to="/student/programmes">Programmes <ArrowRight size={16} aria-hidden /></Link><Link to="/student/profile">My profile <ArrowRight size={16} aria-hidden /></Link></nav>
            </section>
          </div>
        );
      }}
    </QueryState>
  );
}

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
