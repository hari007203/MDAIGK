import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, ChartNoAxesCombined, ClipboardList, Globe2, GraduationCap, Plus, Sparkles, Users } from 'lucide-react';
import { useGet } from '../../api/hooks';
import type { ClassStudent } from '../../api/portalTypes';
import { Card, PageHeader, Toolbar } from '../../components/Cards';
import { TeacherPageHeading } from '../../components/TeacherPageHeading';
import { DataTable } from '../../components/DataTable';
import { EmptyState, QueryState } from '../../components/Feedback';
import { DASH, dateTime, pct } from '../../lib/format';
import { useDebounced } from '../../lib/useDebounced';
import { useTeacherClasses } from './shared';
import { FilterField } from '../school/shared';

function TeacherScoreRing({ value, sampleSize }: { value?: number | null; sampleSize?: number }) {
  const score = sampleSize && value != null ? Math.max(0, Math.min(100, value)) : null;
  return (
    <span className={`teacher-score-ring${score == null ? ' teacher-score-ring--empty' : ''}`} style={score == null ? undefined : { background: `conic-gradient(#18a85f ${score}%, #e5eee5 ${score}% 100%)` }} aria-label={score == null ? 'No average score yet' : `Average score ${pct(score)}`}>
      <span>{score == null ? DASH : pct(score)}<small>Avg</small></span>
    </span>
  );
}

export default function TeacherClasses() {
  const q = useTeacherClasses();
  const [classFilter, setClassFilter] = useState<'all' | 'active' | 'inactive'>('all');
  return (
    <div className="teacher-classes-page">
      <TeacherPageHeading icon={BookOpen} title="My classes" subtitle="Class sections and subjects you are assigned to teach." art="/school-illustration.svg" />
      <QueryState query={q} loadingLabel="Loading classes…">
        {(classes) =>
          classes.length === 0 ? (
            <EmptyState title="No classes assigned" message="Ask your School Admin to assign you to a class section." />
          ) : (
            <>
              {(() => {
                const activeClasses = classes.filter((c) => !c.locked);
                const inactiveClasses = classes.filter((c) => c.locked);
                const visibleClasses = classFilter === 'active' ? activeClasses : classFilter === 'inactive' ? inactiveClasses : classes;
                const quickClass = activeClasses[0];
                return (
                  <>
                    <nav className="teacher-class-filters" aria-label="Filter classes">
                      {([
                        ['all', 'All Classes', classes.length],
                        ['active', 'Active', activeClasses.length],
                        ['inactive', 'Inactive', inactiveClasses.length],
                      ] as const).map(([value, label, count]) => (
                        <button key={value} type="button" className={`teacher-class-filter${classFilter === value ? ' is-active' : ''}`} aria-pressed={classFilter === value} onClick={() => setClassFilter(value)}>
                          {label} <span>{count}</span>
                        </button>
                      ))}
                    </nav>
                    {visibleClasses.length ? (
                      <div className="teacher-class-list">
                        {visibleClasses.map((c, index) => {
                          const Illustration = [BookOpen, Globe2, GraduationCap][index % 3];
                          return (
                            <Card key={c.sectionId} className={`teacher-class-card teacher-class-card--tone-${index % 3}`} title={c.label} subtitle="Class Teacher" actions={<div className="teacher-class-card__summary"><TeacherScoreRing value={c.averagePercent} sampleSize={c.sampleSize} /><span className={`badge ${c.locked ? 'badge--grey' : 'badge--green'}`}>{c.locked ? 'Locked' : 'Active'}</span></div>}>
                              <div className="teacher-class-card__layout">
                                <span className="teacher-class-card__illustration" aria-hidden="true"><Illustration size={35} strokeWidth={1.9} /></span>
                                <div className="teacher-class-card__info">
                                  <span className="teacher-class-card__year">{c.academicYear ? `Academic year ${c.academicYear}` : c.subjects.map((subject) => subject.name).join(' · ') || 'No subjects assigned'}</span>
                                  {c.locked && <span className="muted small">This class level is not enabled for your school right now.</span>}
                                </div>
                                <div className="teacher-class-card__metric teacher-class-card__metric--students"><Users size={18} aria-hidden /><strong>{c.studentCount ?? DASH}</strong><small>Students</small></div>
                                <div className="teacher-class-card__metric teacher-class-card__metric--subjects"><BookOpen size={18} aria-hidden /><strong>{c.subjects.length}</strong><small>Subjects</small></div>
                                {!c.locked && <Link className="teacher-class-card__arrow" to={`/teacher/classes/${c.sectionId}/students`} aria-label={`View students in ${c.label}`}><ArrowRight size={19} aria-hidden /></Link>}
                              </div>
                              <div className="teacher-class-card__actions">
                                {!c.locked && <Link className="btn btn--secondary btn--sm" to={`/teacher/classes/${c.sectionId}/students`}><Users size={14} aria-hidden /> Students</Link>}
                                {!c.locked && <Link className="btn btn--ghost btn--sm" to={`/teacher/activities?sectionId=${c.sectionId}`}><ClipboardList size={14} aria-hidden /> Activities</Link>}
                                {!c.locked && <Link className="btn btn--ghost btn--sm" to={`/teacher/performance?sectionId=${c.sectionId}`}><ChartNoAxesCombined size={14} aria-hidden /> Performance</Link>}
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    ) : <EmptyState title={classFilter === 'active' ? 'No active classes' : 'No inactive classes'} />}

                    <section className="teacher-class-quick-actions" aria-label="Quick actions">
                      <h2><Sparkles size={18} aria-hidden /> Quick Actions</h2>
                      <div className="teacher-class-quick-actions__grid">
                        {quickClass && <Link to={`/teacher/classes/${quickClass.sectionId}/students`}><Users size={21} aria-hidden /><strong>View Students</strong><small>{quickClass.label}</small></Link>}
                        <Link to="/teacher/activities?new=1"><Plus size={21} aria-hidden /><strong>Assign Activity</strong><small>Create for a class</small></Link>
                        {quickClass && <Link to={`/teacher/performance?sectionId=${quickClass.sectionId}`}><BarChart3 size={21} aria-hidden /><strong>Performance</strong><small>{quickClass.label} results</small></Link>}
                      </div>
                    </section>
                  </>
                );
              })()}
            </>
          )
        }
      </QueryState>
    </div>
  );
}

export function ClassStudentsPage() {
  const { sectionId = '' } = useParams();
  const classes = useTeacherClasses();
  const [search, setSearch] = useState('');
  const term = useDebounced(search.trim(), 250);
  const q = useGet<ClassStudent[]>(`/teacher/classes/${sectionId}/students`, { q: term || undefined });
  const cls = classes.data?.find((c) => c.sectionId === sectionId);

  return (
    <>
      <PageHeader
        title={cls ? `${cls.label} students` : 'Class students'}
        subtitle={cls ? cls.subjects.map((s) => s.name).join(', ') : undefined}
        breadcrumb={
          <Link to="/teacher/classes">
            <ArrowLeft size={14} aria-hidden /> My classes
          </Link>
        }
      />
      <Card>
        <Toolbar>
          <div className="toolbar__grow">
            <FilterField label="Search">
              <input type="search" placeholder="Name or student ID" value={search} onChange={(e) => setSearch(e.target.value)} />
            </FilterField>
          </div>
          {q.data && <span className="muted small">{q.data.length} student{q.data.length === 1 ? '' : 's'} · averages are all-time quiz scores</span>}
        </Toolbar>
        <DataTable
          rows={q.data}
          loading={q.isLoading}
          error={q.isError ? q.error : undefined}
          onRetry={() => void q.refetch()}
          fetching={q.isFetching}
          rowKey={(r) => r.id}
          emptyTitle={term ? 'No students match your search' : 'No students in this class yet'}
          caption="Students in this class"
          columns={[
            {
              key: 'name',
              header: 'Student',
              render: (r) => (
                <Link to={`/teacher/students/${r.id}`}>
                  <strong>{r.name}</strong>
                  {r.displayName && r.displayName !== r.name ? <span className="muted small"> ({r.displayName})</span> : null}
                </Link>
              ),
            },
            { key: 'code', header: 'Student ID', render: (r) => r.studentCode },
            { key: 'avg', header: 'Average', align: 'right', render: (r) => (r.attempts ? pct(r.averagePercent) : DASH) },
            { key: 'attempts', header: 'Quizzes', align: 'right', render: (r) => r.attempts, hideSm: true },
            { key: 'cert', header: 'Cert. level', align: 'right', render: (r) => (r.certificationLevel ? `L${r.certificationLevel}` : DASH), hideSm: true },
            { key: 'login', header: 'Last sign-in', render: (r) => dateTime(r.lastLoginAt ?? null), hideSm: true },
          ]}
        />
      </Card>
    </>
  );
}
