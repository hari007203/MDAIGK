import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BarChart3, BookOpen, ClipboardCheck, FileText, Filter, Lock, MoreVertical, Pencil, Plus, Search, Send } from 'lucide-react';
import { api } from '../../api/client';
import { useGet, useMutate } from '../../api/hooks';
import type { ActivityType, TeacherActivity } from '../../api/portalTypes';
import { Badge } from '../../components/Badge';
import { Card, StatCard, StatGrid } from '../../components/Cards';
import { TeacherPageHeading } from '../../components/TeacherPageHeading';
import { DataTable } from '../../components/DataTable';
import { ConfirmDialog } from '../../components/Modal';
import { DASH, dateTime } from '../../lib/format';
import { FilterField } from '../school/shared';
import { ActivityFormModal } from './ActivityForm';
import { STATUS_TONE, activitySection, activitySubject, classLabel, useTeacherClasses } from './shared';
import './TeacherActivities.css';

export default function TeacherActivities() {
  const [params, setParams] = useSearchParams();
  const sectionId = params.get('sectionId') ?? '';
  const status = params.get('status') ?? '';
  const classes = useTeacherClasses();
  const q = useGet<TeacherActivity[]>('/teacher/activities', { sectionId: sectionId || undefined, status: status || undefined });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherActivity | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'publish' | 'close'; a: TeacherActivity } | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | ActivityType>('all');
  const [filtersOpen, setFiltersOpen] = useState(Boolean(sectionId || status));
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('new') === '1' && classes.data) {
      setEditing(null);
      setFormOpen(true);
      const p = new URLSearchParams(params);
      p.delete('new');
      setParams(p, { replace: true });
    }
  }, [params, classes.data, setParams]);

  const action = useMutate((v: { kind: 'publish' | 'close'; id: string }) => api.post(`/teacher/activities/${v.id}/${v.kind}`), {
    invalidate: ['/teacher'],
    success: (_d) => (confirm?.kind === 'close' ? 'Activity closed' : 'Activity published — students can see it now'),
    onSuccess: () => setConfirm(null),
  });

  function setFilter(k: string, v: string) {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p);
  }

  const activities = q.data ?? [];
  const visibleActivities = activities.filter((activity) => {
    const matchesCategory = category === 'all' || activity.type === category;
    const needle = search.trim().toLocaleLowerCase();
    const matchesSearch = !needle || [activity.title, activity.type, activitySubject(activity)?.name, classLabel(activitySection(activity))]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase().includes(needle));
    return matchesCategory && matchesSearch;
  });
  const ongoingCount = activities.filter((activity) => activity.status === 'published' && (activity.completedCount ?? 0) > 0 && activity.recipientCount != null && activity.completedCount! < activity.recipientCount).length;
  const completedCount = activities.filter((activity) => activity.recipientCount != null && activity.recipientCount > 0 && (activity.completedCount ?? 0) >= activity.recipientCount).length;

  return (
    <div className="teacher-activities-page">
      <TeacherPageHeading
        icon={ClipboardCheck}
        title="Activities"
        subtitle="Assign quizzes, practice and worksheets to your classes."
        actions={
          <button
            type="button"
            className="btn btn--primary"
            disabled={!classes.data}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus size={16} aria-hidden /> New activity
          </button>
        }
      />
      {q.data && (
        <StatGrid>
          <StatCard label="Total" value={activities.length} icon={ClipboardCheck} hint="Activities matching filters" />
          <StatCard label="Assigned" value={activities.filter((activity) => activity.status === 'published').length} icon={Send} tone="positive" hint="Published to classes" />
          <StatCard label="Ongoing" value={ongoingCount} icon={BookOpen} tone="gold" hint="Submissions underway" />
          <StatCard label="Completed" value={completedCount} icon={FileText} tone="muted" hint="All recipients submitted" />
        </StatGrid>
      )}
      <Card>
        <div className="teacher-activity-controls">
          <label className="teacher-activity-search">
            <Search size={17} aria-hidden />
            <span className="sr-only">Search activities</span>
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activities…" />
          </label>
          <button type="button" className={`teacher-activity-filter-button${filtersOpen ? ' is-open' : ''}`} aria-expanded={filtersOpen} aria-controls="teacher-activity-filter-panel" aria-label={sectionId || status ? 'Filters, active filters applied' : 'Filters'} onClick={() => setFiltersOpen((open) => !open)}>
            <Filter size={17} aria-hidden /> <span>Filters</span>
            {(sectionId || status) && <span className="teacher-activity-filter-indicator" aria-hidden="true" />}
          </button>
        </div>
        <nav className="teacher-activity-categories" aria-label="Filter by activity type">
          {q.data && ([
            ['all', 'All', activities.length],
            ['quiz', 'Quiz', activities.filter((activity) => activity.type === 'quiz').length],
            ['practice', 'Practice', activities.filter((activity) => activity.type === 'practice').length],
            ['worksheet', 'Worksheet', activities.filter((activity) => activity.type === 'worksheet').length],
          ] as const).map(([value, label, count]) => (
            <button type="button" key={value} className={`teacher-activity-category${category === value ? ' is-active' : ''}`} aria-pressed={category === value} onClick={() => setCategory(value)}>
              {label} <span>{count}</span>
            </button>
          ))}
        </nav>
        {filtersOpen && <div className="teacher-activity-filter-selects" id="teacher-activity-filter-panel">
            <FilterField label="Class">
              <select value={sectionId} onChange={(e) => setFilter('sectionId', e.target.value)}>
                <option value="">All my classes</option>
                {classes.data?.map((c) => (
                  <option key={c.sectionId} value={c.sectionId}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Status">
              <select value={status} onChange={(e) => setFilter('status', e.target.value)}>
                <option value="">Any status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </FilterField>
        </div>}
        <div className="teacher-activity-table">
        <DataTable
          rows={q.data ? visibleActivities : undefined}
          loading={q.isLoading}
          error={q.isError ? q.error : undefined}
          onRetry={() => void q.refetch()}
          fetching={q.isFetching}
          rowKey={(r) => r._id}
          emptyTitle={search || category !== 'all' ? 'No activities match these filters' : 'No activities yet'}
          emptyMessage={search || category !== 'all' ? 'Try another search or activity type.' : 'Create an activity to assign work to a class.'}
          caption="Activities"
          columns={[
            {
              key: 'title',
              header: 'Activity',
              render: (a) => (
                <div className="teacher-activity-cell">
                  <span className={`teacher-activity-cell__icon teacher-activity-cell__icon--${a.type}`} aria-hidden="true">
                    {a.type === 'worksheet' ? <FileText size={21} /> : a.type === 'practice' ? <BookOpen size={21} /> : <ClipboardCheck size={21} />}
                  </span>
                  <div className="teacher-activity-cell__copy">
                    <Link to={`/teacher/activities/${a._id}/results`}><strong>{a.title}</strong></Link>
                    <div className="muted small">{activitySubject(a)?.name ?? DASH}{a.studentIds?.length ? ` · ${a.studentIds.length} selected students` : ''}</div>
                    <div className="teacher-activity-cell__type">{a.type}</div>
                  </div>
                </div>
              ),
            },
            { key: 'class', header: 'Class', render: (a) => classLabel(activitySection(a)) },
            { key: 'due', header: 'Due', render: (a) => dateTime(a.dueAt), hideSm: true },
            { key: 'status', header: 'Status', render: (a) => <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge> },
            {
              key: 'done',
              header: 'Completed',
              align: 'right',
              render: (a) => (a.status === 'draft' ? DASH : `${a.completedCount ?? 0} / ${a.recipientCount ?? 0}`),
            },
            {
              key: 'actions',
              header: <span className="sr-only">Actions</span>,
              align: 'right',
              render: (a) => (
                <div className="teacher-activity-actions" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenActionId(null); }} onKeyDown={(event) => {
                  if (event.key === 'Escape') setOpenActionId(null);
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]'));
                    if (items.length) {
                      event.preventDefault();
                      const index = items.indexOf(document.activeElement as HTMLElement);
                      const next = event.key === 'ArrowDown' ? (index + 1) % items.length : (index <= 0 ? items.length - 1 : index - 1);
                      items[next].focus();
                    }
                  }
                }}>
                  <button type="button" className="teacher-activity-actions__trigger" aria-label={`Actions for ${a.title}`} aria-haspopup="menu" aria-expanded={openActionId === a._id} aria-controls={`teacher-activity-actions-${a._id}`} onClick={() => setOpenActionId((id) => id === a._id ? null : a._id)}>
                    <MoreVertical size={19} aria-hidden />
                  </button>
                  {openActionId === a._id && <div id={`teacher-activity-actions-${a._id}`} className="teacher-activity-actions__menu" role="menu" aria-label={`Actions for ${a.title}`}>
                    {a.status !== 'closed' && <button type="button" role="menuitem" onClick={() => { setOpenActionId(null); setEditing(a); setFormOpen(true); }}><Pencil size={15} aria-hidden /> Edit</button>}
                    {a.status === 'draft' && <button type="button" role="menuitem" onClick={() => { setOpenActionId(null); setConfirm({ kind: 'publish', a }); }}><Send size={15} aria-hidden /> Publish</button>}
                    {a.status === 'published' && <button type="button" role="menuitem" onClick={() => { setOpenActionId(null); setConfirm({ kind: 'close', a }); }}><Lock size={15} aria-hidden /> Close</button>}
                    {a.status !== 'draft' && <Link role="menuitem" to={`/teacher/activities/${a._id}/results`} onClick={() => setOpenActionId(null)}><BarChart3 size={15} aria-hidden /> Results</Link>}
                  </div>}
                </div>
              ),
            },
          ]}
        />
        </div>
      </Card>
      {classes.data && <ActivityFormModal open={formOpen} onClose={() => setFormOpen(false)} classes={classes.data} editing={editing} initialSection={sectionId || undefined} />}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.kind === 'close' ? 'Close activity?' : 'Publish activity?'}
        message={
          confirm?.kind === 'close'
            ? `Students will no longer be able to submit “${confirm?.a.title}”. This can’t be undone.`
            : `“${confirm?.a.title}” will be visible to students from its start time and they’ll get a notification.`
        }
        confirmLabel={confirm?.kind === 'close' ? 'Close activity' : 'Publish'}
        tone={confirm?.kind === 'close' ? 'danger' : 'primary'}
        busy={action.isPending}
        onConfirm={() => confirm && action.mutate({ kind: confirm.kind, id: confirm.a._id })}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
