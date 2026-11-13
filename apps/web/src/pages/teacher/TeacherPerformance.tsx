import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { BarChart3, BookOpen, Calculator, Cpu, FlaskConical, Globe2, Target, TrendingDown, TrendingUp, Trophy, Users } from 'lucide-react';
import { Area, Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useGet } from '../../api/hooks';
import type { TeacherPerformance as Perf } from '../../api/portalTypes';
import { Card, ChartCard, StatCard, StatGrid, Toolbar } from '../../components/Cards';
import { TeacherPageHeading } from '../../components/TeacherPageHeading';
import { InlineAlert, QueryState } from '../../components/Feedback';
import { CHART, axisProps, pctTick, tooltipProps } from '../../components/charts';
import { DASH, pct } from '../../lib/format';
import { FilterField, periodLabel } from '../school/shared';
import { useTeacherClasses } from './shared';
import './TeacherPerformance.css';

function subjectStyle(name: string) {
  const subject = name.toLocaleLowerCase();
  if (/english|language|literature/.test(subject)) return { Icon: BookOpen, color: '#e54d52' };
  if (/math|algebra|geometry/.test(subject)) return { Icon: Calculator, color: '#e5a300' };
  if (/science|biology|chemistry|physics/.test(subject)) return { Icon: FlaskConical, color: '#149ec8' };
  if (/computer|artificial intelligence|\bai\b|technology/.test(subject)) return { Icon: Cpu, color: '#4483d2' };
  if (/sport|physical education|\bpe\b/.test(subject)) return { Icon: Trophy, color: '#e98525' };
  if (/social|history|geography|civics/.test(subject)) return { Icon: Globe2, color: '#198b59' };
  return { Icon: BookOpen, color: '#16834f' };
}

export default function TeacherPerformance() {
  const [activeView, setActiveView] = useState<'overview' | 'subjects'>('overview');
  const [params, setParams] = useSearchParams();
  const sectionId = params.get('sectionId') ?? '';
  const subjectId = params.get('subjectId') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const rangeError = from && to && from > to ? 'The start date must be before the end date' : null;
  const classes = useTeacherClasses();
  const q = useGet<Perf>('/teacher/performance', { sectionId: sectionId || undefined, subjectId: subjectId || undefined, from: from || undefined, to: to || undefined }, { enabled: !rangeError });

  const subjectOptions = (() => {
    const list = (classes.data ?? []).filter((c) => !sectionId || c.sectionId === sectionId).flatMap((c) => c.subjects);
    return [...new Map(list.map((s) => [s._id, s])).values()];
  })();

  function set(k: string, v: string) {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    if (k === 'sectionId' && subjectId && v) {
      const cls = classes.data?.find((c) => c.sectionId === v);
      if (cls && !cls.subjects.some((s) => s._id === subjectId)) p.delete('subjectId');
    }
    setParams(p);
  }

  const period = periodLabel(from || undefined, to || undefined);
  const scope = `${sectionId ? (classes.data?.find((c) => c.sectionId === sectionId)?.label ?? 'Class') : 'All my classes'}${subjectId ? ` · ${subjectOptions.find((s) => s._id === subjectId)?.name ?? ''}` : ' · all subjects'}`;

  return (
      <div className="teacher-performance-page">
      <TeacherPageHeading icon={BarChart3} title="Performance" subtitle="Track class and student performance." />
      <nav className="teacher-performance-tabs" aria-label="Performance views">
        <a className={`teacher-performance-tab${activeView === 'overview' ? ' is-active' : ''}`} href="#teacher-performance-overview" aria-current={activeView === 'overview' ? 'page' : undefined} onClick={() => setActiveView('overview')}>Class Overview</a>
        <span className="teacher-performance-tab is-unavailable" aria-disabled="true" title="Student-level performance is not available in this report">Student Performance</span>
        <a className={`teacher-performance-tab${activeView === 'subjects' ? ' is-active' : ''}`} href="#teacher-performance-subjects" aria-current={activeView === 'subjects' ? 'page' : undefined} onClick={() => setActiveView('subjects')}>Subject Wise</a>
      </nav>
      <Card className="teacher-performance-filter-card">
        <Toolbar>
          <FilterField label="Class">
            <select value={sectionId} onChange={(e) => set('sectionId', e.target.value)}>
              <option value="">All my classes</option>
              {classes.data
                ?.filter((c) => !c.locked)
                .map((c) => (
                  <option key={c.sectionId} value={c.sectionId}>
                    {c.label}
                  </option>
                ))}
            </select>
          </FilterField>
          <FilterField label="Subject">
            <select value={subjectId} onChange={(e) => set('subjectId', e.target.value)}>
              <option value="">All my subjects</option>
              {subjectOptions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="From">
            <input type="date" value={from} max={to || undefined} onChange={(e) => set('from', e.target.value)} aria-invalid={Boolean(rangeError)} />
          </FilterField>
          <FilterField label="To">
            <input type="date" value={to} min={from || undefined} onChange={(e) => set('to', e.target.value)} aria-invalid={Boolean(rangeError)} />
          </FilterField>
        </Toolbar>
        {rangeError && <InlineAlert>{rangeError}</InlineAlert>}
      </Card>
      {!rangeError && (
        <QueryState query={q} loadingLabel="Loading performance…">
          {(p) => {
            const validTrend = p.trend.filter((point) => point.averagePercent != null);
            const trendDelta = validTrend.length > 1 ? (validTrend[validTrend.length - 1].averagePercent! - validTrend[0].averagePercent!) : null;
            const trendLabel = trendDelta == null ? DASH : `${trendDelta > 0 ? '+' : ''}${Number(trendDelta.toFixed(1))} pp`;
            const studentCount = (() => {
              if (!classes.data) return DASH;
              if (sectionId) return classes.data.find((c) => c.sectionId === sectionId)?.studentCount ?? DASH;
              if (classes.data.some((c) => c.studentCount == null)) return DASH;
              return classes.data.reduce((total, c) => total + (c.studentCount ?? 0), 0);
            })();
            const quizAccuracy = p.summary.sampleSize ? pct(p.summary.quizAccuracyPercent) : DASH;
            const completion = p.activityCompletion?.expected ? pct(p.activityCompletion.ratePercent) : DASH;
            const completionDetail = p.activityCompletion?.expected ? `${p.activityCompletion.completed} of ${p.activityCompletion.expected} · ${completion}` : 'No published activities';
            const hasSubjectScores = p.subjects.some((subject) => subject.sampleSize > 0);
            return (
              <>
                <div className="teacher-performance-summary" id="teacher-performance-overview">
                  <StatGrid>
                    <StatCard label="Class Average" value={p.summary.sampleSize ? pct(p.summary.averagePercent) : DASH} icon={Target} tone="positive" hint={`Quiz accuracy ${quizAccuracy} · n = ${p.summary.sampleSize}`} />
                    <StatCard label="Performance Trend" value={trendLabel} icon={trendDelta != null && trendDelta < 0 ? TrendingDown : TrendingUp} tone={trendDelta != null && trendDelta < 0 ? 'gold' : 'positive'} hint={<>{validTrend.length > 1 ? `${validTrend[0].week} to ${validTrend[validTrend.length - 1].week}` : 'Not enough weekly data'}<br />Activity completion {completionDetail}</>} />
                    <StatCard label="Students" value={studentCount} icon={Users} tone="muted" hint={sectionId ? scope.split(' · ')[0] : 'Across your assigned classes'} />
                  </StatGrid>
                </div>

                <div className="teacher-performance-main-grid">
                  <Card className="teacher-performance-subject-card" title="Subject Performance" subtitle={`${scope} · ${period}`}>
                    <span className="teacher-performance-anchor" id="teacher-performance-subjects" aria-hidden="true" />
                    {p.subjects.length ? <div className="teacher-performance-subject-list">
                      {p.subjects.map((subject) => {
                        const visual = subjectStyle(subject.name);
                        const SubjectIcon = visual.Icon;
                        const score = subject.sampleSize ? Math.max(0, Math.min(100, subject.averagePercent ?? 0)) : 0;
                        return <div className="teacher-performance-subject-row" key={subject.subjectId} style={{ '--subject-color': visual.color } as CSSProperties}>
                          <span className="teacher-performance-subject-row__icon" aria-hidden="true"><SubjectIcon size={17} /></span>
                          <span className="teacher-performance-subject-row__name">{subject.name}</span>
                          <span className="teacher-performance-subject-row__track" aria-hidden="true"><span style={{ width: `${score}%` }} /></span>
                          <strong>{subject.sampleSize ? pct(subject.averagePercent) : DASH}</strong>
                        </div>;
                      })}
                    </div> : <p className="muted small">No subjects are available for this class.</p>}
                  </Card>

                  <ChartCard title="Performance Trend" period={`${scope} · ${period} · ISO weeks`} height={286} empty={p.trend.length === 0} emptyMessage="No quiz attempts in this period.">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={p.trend} margin={{ top: 13, right: 12, bottom: 1, left: -7 }}>
                        <defs>
                          <linearGradient id="teacher-performance-area" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#35b86b" stopOpacity={0.24} />
                            <stop offset="100%" stopColor="#35b86b" stopOpacity={0.025} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke={CHART.grid} />
                        <XAxis dataKey="week" {...axisProps} interval="preserveStartEnd" tickFormatter={(week: string) => week.replace(/^\d{4}-/, '')} />
                        <YAxis domain={[0, 100]} tickFormatter={pctTick} {...axisProps} />
                        <Tooltip {...tooltipProps} formatter={(value: number, _name, item) => [`${value}% (n = ${(item.payload as { attempts: number }).attempts})`, 'Average']} />
                        <Area type="monotone" dataKey="averagePercent" stroke="none" fill="url(#teacher-performance-area)" connectNulls={false} isAnimationActive />
                        <Line type="monotone" dataKey="averagePercent" stroke="#128548" strokeWidth={2.5} dot={{ r: 4, fill: '#128548', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive>
                          {validTrend.length <= 8 && <LabelList dataKey="averagePercent" position="top" formatter={(value: number | null) => value == null ? '' : `${Math.round(value)}%`} className="teacher-performance-trend-label" />}
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>

                <ChartCard title="Average score by subject" period={`${scope} · ${period}`} height={270} empty={!hasSubjectScores} emptyMessage="No quiz attempts in this period.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={p.subjects.map((subject) => ({ name: subject.name, value: subject.sampleSize ? subject.averagePercent : null, n: subject.sampleSize }))} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
                      <CartesianGrid vertical={false} stroke={CHART.grid} />
                      <XAxis dataKey="name" {...axisProps} interval="preserveStartEnd" tickFormatter={(name: string) => (name.length > 12 ? `${name.slice(0, 11)}…` : name)} />
                      <YAxis domain={[0, 100]} tickFormatter={pctTick} {...axisProps} />
                      <Tooltip {...tooltipProps} formatter={(value: number, _name, item) => [`${value}% (n = ${(item.payload as { n: number }).n})`, 'Average']} />
                      <Bar dataKey="value" fill={CHART.primary} radius={[6, 6, 0, 0]} maxBarSize={26} isAnimationActive />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <Card className="teacher-performance-table-card" title="Subjects" subtitle={`${scope} · ${period}`}>
                  <div className="teacher-performance-table-wrap">
                    <table className="table teacher-performance-table">
                      <caption className="sr-only">Average by subject</caption>
                      <thead>
                        <tr><th>Subject</th><th className="num">Average</th><th className="num">Attempts (n)</th></tr>
                      </thead>
                      <tbody>
                        {p.subjects.map((subject) => (
                          <tr key={subject.subjectId}>
                            <td><div className="teacher-subject-table-cell"><span>{subject.name}</span><span className="teacher-subject-performance__track" aria-hidden="true"><span style={{ width: `${subject.sampleSize ? Math.max(0, Math.min(100, subject.averagePercent ?? 0)) : 0}%` }} /></span></div></td>
                            <td className="num">{subject.sampleSize ? pct(subject.averagePercent) : DASH}</td>
                            <td className="num">{subject.sampleSize}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            );
          }}
        </QueryState>
      )}
      </div>
  );
}
