import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpenCheck, ChartNoAxesCombined, Info, Lightbulb, LifeBuoy, Star, Trophy, Users } from 'lucide-react';
import { useGet } from '../../api/hooks';
import type { InsightRow, TeacherInsights as Insights } from '../../api/portalTypes';
import { Card, StatCard, StatGrid } from '../../components/Cards';
import { TeacherPageHeading } from '../../components/TeacherPageHeading';
import { DataTable } from '../../components/DataTable';
import { InlineAlert, QueryState } from '../../components/Feedback';
import { DASH, pct } from '../../lib/format';
import { FilterField } from '../school/shared';
import { useTeacherClasses } from './shared';
import './TeacherInsights.css';

function InsightTable({ rows, empty }: { rows: InsightRow[]; empty: string }) {
  return (
    <DataTable
      rows={rows}
      rowKey={(r) => r.studentId}
      emptyTitle={empty}
      columns={[
        { key: 'name', header: 'Student', render: (r) => <Link to={`/teacher/students/${r.studentId}`}>{r.name}</Link> },
        { key: 'class', header: 'Class', render: (r) => r.class },
        { key: 'avg', header: 'Average', align: 'right', render: (r) => (r.attempts ? pct(r.averagePercent) : DASH) },
        { key: 'n', header: 'Quizzes (n)', align: 'right', render: (r) => r.attempts },
      ]}
    />
  );
}

export default function TeacherInsights() {
  const [params, setParams] = useSearchParams();
  const sectionId = params.get('sectionId') ?? '';
  const classes = useTeacherClasses();
  const q = useGet<Insights>('/teacher/insights', { sectionId: sectionId || undefined });
  return (
    <div className="teacher-insights-page">
      <TeacherPageHeading
        icon={Lightbulb}
        title="Insights"
        subtitle="Identify learning trends and take action."
        art="/mango-learning-illustration.svg"
        actions={
          <div className="teacher-insights-filter">
            <FilterField label="Class">
              <select value={sectionId} onChange={(e) => setParams(e.target.value ? { sectionId: e.target.value } : {})}>
                <option value="">All my classes</option>
                {classes.data
                  ?.filter((c) => !c.locked)
                  .map((c) => <option key={c.sectionId} value={c.sectionId}>{c.label}</option>)}
              </select>
            </FilterField>
          </div>
        }
      />
      <QueryState query={q} loadingLabel="Loading insights…">
        {(d) => {
          const supportNames = d.needsSupport.slice(0, 3);
          const performerNames = d.topPerformers.slice(0, 3);
          return (
            <>
              <div className="teacher-insights-summary">
                <StatGrid>
                  <StatCard label="Top performers" value={d.topPerformers.length} icon={Trophy} tone="positive" hint={d.window} />
                  <StatCard label="Needs support" value={d.needsSupport.length} icon={LifeBuoy} tone={d.needsSupport.length ? 'gold' : 'positive'} hint={d.window} />
                  <StatCard label="Reporting window" value={d.window} icon={ChartNoAxesCombined} hint="Based on quiz results" />
                </StatGrid>
              </div>

              <div className="teacher-insights-feature-grid">
                <Card className="teacher-insights-feature-card" title={<><Lightbulb size={19} aria-hidden /> Key Insights</>} subtitle={`Based on quiz results · ${d.window}`}>
                  <div className="teacher-insights-rows">
                    <div className="teacher-insights-row">
                      <span className="teacher-insights-row__icon teacher-insights-row__icon--green"><Info size={19} /></span>
                      <div className="teacher-insights-row__copy"><strong>Reporting rule</strong><span>{d.rule}</span></div>
                    </div>
                    <div className="teacher-insights-row">
                      <span className="teacher-insights-row__icon teacher-insights-row__icon--blue"><Users size={19} /></span>
                      <div className="teacher-insights-row__copy"><strong>{d.needsSupport.length} students need support</strong><span>{supportNames.length ? supportNames.map((row) => `${row.name} · ${row.class}`).join(' · ') : 'No students are flagged in this reporting window.'}</span></div>
                    </div>
                    <div className="teacher-insights-row">
                      <span className="teacher-insights-row__icon teacher-insights-row__icon--gold"><Star size={19} /></span>
                      <div className="teacher-insights-row__copy"><strong>{d.topPerformers.length} top performers</strong><span>{performerNames.length ? performerNames.map((row) => `${row.name} · ${row.class}`).join(' · ') : 'No top performers are available for this reporting window.'}</span></div>
                    </div>
                  </div>
                </Card>

                <Card className="teacher-insights-feature-card" title={<><BookOpenCheck size={19} aria-hidden /> Explore Insights</>} subtitle="Open the existing student records and reports">
                  <div className="teacher-insights-actions">
                    <a className="teacher-insights-action" href="#needs-support-table"><span className="teacher-insights-action__icon teacher-insights-action__icon--green"><LifeBuoy size={19} /></span><span>Review students needing support</span><ArrowRight size={17} /></a>
                    <a className="teacher-insights-action" href="#top-performers-table"><span className="teacher-insights-action__icon teacher-insights-action__icon--gold"><Trophy size={19} /></span><span>View top performers</span><ArrowRight size={17} /></a>
                    {d.needsSupport[0] && <Link className="teacher-insights-action" to={`/teacher/students/${d.needsSupport[0].studentId}`}><span className="teacher-insights-action__icon teacher-insights-action__icon--coral"><Users size={19} /></span><span>Open {d.needsSupport[0].name}’s profile</span><ArrowUpRight size={17} /></Link>}
                  </div>
                </Card>
              </div>

              <div className="teacher-insights-notice">
                <InlineAlert tone="info"><Info size={15} aria-hidden /> <strong>{d.window}.</strong> {d.rule}</InlineAlert>
              </div>

              <div className="teacher-insights-tables">
                <div id="top-performers-table" className="teacher-insights-table-anchor">
                  <Card className="teacher-insights-table-card" title={<><Star size={17} aria-hidden className="text-gold" /> Top Performers</>} subtitle={`${d.window} · highest averages`}>
                    <div className="teacher-insights-table"><InsightTable rows={d.topPerformers} empty="Not enough quiz data yet" /></div>
                  </Card>
                </div>
                <div id="needs-support-table" className="teacher-insights-table-anchor">
                  <Card className="teacher-insights-table-card" title={<><LifeBuoy size={17} aria-hidden /> Needs Support</>} subtitle={d.window}>
                    <div className="teacher-insights-table"><InsightTable rows={d.needsSupport} empty="No students flagged — great!" /></div>
                  </Card>
                </div>
              </div>
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
