import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { ArrowUpRight, BarChart3, CalendarClock, CalendarDays, ClipboardCheck, ClipboardList, GraduationCap, House, LifeBuoy, Plus, Star, Users } from 'lucide-react';
import { useGet } from '../../api/hooks';
import type { TeacherHome as Home, TeacherInsights, TeacherPerformance } from '../../api/portalTypes';
import { Card, StatCard, StatGrid } from '../../components/Cards';
import { TeacherPageHeading } from '../../components/TeacherPageHeading';
import { EmptyState, QueryState } from '../../components/Feedback';
import { DASH, dateTime, pct } from '../../lib/format';
import { greeting } from '../student/shared';

export default function TeacherHome() {
  const q = useGet<Home>('/teacher/home');
  const performance = useGet<TeacherPerformance>('/teacher/performance');
  const insights = useGet<TeacherInsights>('/teacher/insights');
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date());
  return (
    <QueryState query={q} loadingLabel="Loading your dashboard…">
      {(h) => {
        const sectionLabel = (id: string) => h.classes.find((c) => c.sectionId === id)?.label ?? '';
        return (
          <div className="teacher-home-page">
            <TeacherPageHeading
              icon={House}
              title={`${greeting()}, ${h.teacher.name.split(' ')[0]}`}
              subtitle={
                <span className="teacher-home__meta">
                  <span className="teacher-home__avatar" aria-hidden="true">{h.teacher.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}</span>
                  <span>Class teacher · {h.teacher.schoolName}</span>
                  <time className="teacher-home__date" dateTime={new Date().toISOString()}><CalendarDays size={14} aria-hidden /> {today}</time>
                </span>
              }
              art="/mango-learning-illustration.svg"
              actions={
                <Link to="/teacher/activities?new=1" className="btn btn--primary">
                  <Plus size={16} aria-hidden /> New activity
                </Link>
              }
            />
            <StatGrid>
              <StatCard label="My classes" value={h.totals.classes} icon={GraduationCap} hint="Assigned class sections" />
              <StatCard label="Students" value={h.totals.students} icon={Users} hint="Across your classes" />
              <StatCard label="Class average" value={performance.data?.summary.sampleSize ? pct(performance.data.summary.averagePercent) : DASH} icon={BarChart3} tone="positive" hint={performance.data?.summary.sampleSize ? `${performance.data.summary.sampleSize} quiz attempts` : 'Quiz results'} />
              <StatCard label="Pending reviews" value={h.totals.pendingReviews} icon={ClipboardCheck} tone={h.totals.pendingReviews ? 'gold' : 'default'} hint="Practice & worksheet submissions" />
            </StatGrid>
            <nav className="teacher-quick-actions" aria-label="Teaching shortcuts">
              <Link to="/teacher/classes"><GraduationCap size={19} aria-hidden /><span><strong>My classes</strong><small>Open class lists</small></span></Link>
              <Link to="/teacher/activities?new=1"><Plus size={19} aria-hidden /><span><strong>Assign activity</strong><small>Create for a class</small></span></Link>
              <Link to="/teacher/performance"><BarChart3 size={19} aria-hidden /><span><strong>Performance</strong><small>Review class progress</small></span></Link>
              <Link to="/teacher/quizzes"><ClipboardList size={19} aria-hidden /><span><strong>My quizzes</strong><small>Manage quiz content</small></span></Link>
            </nav>
            <Card className="teacher-home-performance" title="Class Performance Overview" subtitle="Subject averages · all time" actions={<Link to="/teacher/performance">View details <ArrowUpRight size={14} aria-hidden /></Link>}>
              <div className="teacher-home-performance__layout">
                <div className="teacher-home-performance__average">
                  <div className={`teacher-home-average-ring${performance.data?.summary.sampleSize ? '' : ' teacher-home-average-ring--empty'}`} style={performance.data?.summary.sampleSize ? { '--average-angle': `${Math.max(0, Math.min(100, performance.data.summary.averagePercent ?? 0)) * 3.6}deg` } as CSSProperties : undefined}>
                    <span><strong>{performance.data?.summary.sampleSize ? pct(performance.data.summary.averagePercent) : DASH}</strong><small>Class average</small></span>
                  </div>
                  <p>{performance.data?.summary.sampleSize ? `Based on ${performance.data.summary.sampleSize} quiz attempts` : 'Average appears after students complete quizzes'}</p>
                  {h.classes.length > 0 && <div className="teacher-home-performance__class-tags">{h.classes.slice(0, 3).map((c) => <Link to={`/teacher/classes/${c.sectionId}/students`} key={c.sectionId}>{c.label}</Link>)}</div>}
                </div>
                <div className="teacher-home-performance__subjects">
                  <h3>Subject performance</h3>
                  {performance.isLoading ? <p className="muted small">Loading subject performance…</p> : performance.isError ? <p className="muted small">Subject performance is currently unavailable.</p> : performance.data?.subjects.length ? (
                    <div className="teacher-subject-performance">
                      {performance.data.subjects.slice(0, 6).map((subject, index) => (
                        <div className="teacher-subject-performance__row" key={subject.subjectId} style={{ '--subject-color': ['#15945b', '#169bd5', '#e5a800', '#8b60d6', '#ef7851', '#61a931'][index % 6] } as CSSProperties}>
                          <span className="teacher-subject-performance__name">{subject.name}</span>
                          <span className="teacher-subject-performance__track" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, subject.averagePercent ?? 0))}%` }} /></span>
                          <strong>{subject.sampleSize ? pct(subject.averagePercent) : DASH}</strong>
                        </div>
                      ))}
                    </div>
                  ) : <p className="muted small">Subject averages will appear after students complete quizzes.</p>}
                </div>
              </div>
            </Card>
            <section className="teacher-student-highlights" aria-label="Student highlights">
              <Card title={<><Star size={16} aria-hidden className="text-gold" /> Top performers</>} subtitle={insights.data?.window ?? 'Based on quiz results'} actions={<Link to="/teacher/insights">View insights <ArrowUpRight size={14} aria-hidden /></Link>}>
                {insights.isLoading ? <p className="muted small">Loading student highlights…</p> : insights.isError ? <p className="muted small">Student highlights are currently unavailable.</p> : insights.data?.topPerformers.length ? <div className="teacher-highlight-list">{insights.data.topPerformers.slice(0, 3).map((student) => <Link to={`/teacher/students/${student.studentId}`} key={student.studentId}><span className="teacher-highlight-list__avatar" aria-hidden>{student.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}</span><span><strong>{student.name}</strong><small>{student.class} · {student.attempts} quiz attempts</small></span><b>{student.attempts ? pct(student.averagePercent) : DASH}</b></Link>)}</div> : <p className="muted small">No student highlights are available for this period.</p>}
              </Card>
              <Card title={<><LifeBuoy size={16} aria-hidden /> Needs improvement</>} subtitle={insights.data?.window ?? 'Based on quiz results'}>
                {insights.isLoading ? <p className="muted small">Loading support signals…</p> : insights.isError ? <p className="muted small">Support signals are currently unavailable.</p> : insights.data?.needsSupport.length ? <div className="teacher-highlight-list">{insights.data.needsSupport.slice(0, 3).map((student) => <Link to={`/teacher/students/${student.studentId}`} key={student.studentId}><span className="teacher-highlight-list__avatar teacher-highlight-list__avatar--support" aria-hidden>{student.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}</span><span><strong>{student.name}</strong><small>{student.class} · {student.attempts} quiz attempts</small></span><b>{student.attempts ? pct(student.averagePercent) : DASH}</b></Link>)}</div> : <p className="muted small">No students are currently flagged for additional support.</p>}
              </Card>
            </section>
            <div className="teacher-home-secondary">
              <Card title="Pending reviews">
                  {h.totals.pendingReviews === 0 ? (
                    <p className="muted">No submissions waiting for feedback.</p>
                  ) : (
                    <p>
                      <strong>{h.totals.pendingReviews}</strong> practice/worksheet submission{h.totals.pendingReviews === 1 ? '' : 's'} waiting for your feedback.{' '}
                      <Link to="/teacher/activities?status=published">Review now</Link>
                    </p>
                  )}
              </Card>
              <Card title="Upcoming due" subtitle="Next published activities">
                  {h.upcoming.length === 0 ? (
                    <EmptyState title="Nothing due soon" />
                  ) : (
                    <ul className="list-plain">
                      {h.upcoming.map((u) => (
                        <li key={u._id}>
                          <CalendarClock size={14} aria-hidden />{' '}
                          <Link to={`/teacher/activities/${u._id}/results`}>{u.title}</Link>
                          <span className="muted small">
                            {' '}
                            · {sectionLabel(u.classSectionId)} · {u.type} · due {dateTime(u.dueAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
              </Card>
            </div>
          </div>
        );
      }}
    </QueryState>
  );
}
