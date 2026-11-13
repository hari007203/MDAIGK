import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutGrid, MapPin, PlusCircle, School, Search, SlidersHorizontal, Users } from 'lucide-react';
import { useGet } from '../../api/hooks';
import type { Paginated, School as SchoolType } from '../../api/types';
import { DataTable } from '../../components/DataTable';
import { PlanBadge, StatusBadge } from '../../components/Badge';
import { classLevels, date, num } from '../../lib/format';
import { useDebounced } from '../../lib/useDebounced';
import { SchoolFormModal } from './SchoolForm';

export default function SchoolsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState(params.get('status') ?? '');
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(params.get('new') === '1');
  const q = useDebounced(search.trim(), 300);

  useEffect(() => setPage(1), [q, status]);
  useEffect(() => {
    if (params.get('new') === '1') {
      setAdding(true);
      params.delete('new');
      setParams(params, { replace: true });
    }
  }, [params, setParams]);

  const list = useGet<Paginated<SchoolType>>('/schools', { q, status, page, pageSize: 20 });

  return (
    <div className="schools-page">
      <div className="schools-head">
        <div className="schools-head__title">
          <span className="schools-head__icon" aria-hidden="true">
            <School size={26} />
          </span>
          <div>
            <h1>Schools</h1>
            <p className="schools-head__sub">{list.data ? `${num(list.data.total)} schools` : 'Manage schools, entitlements and subscriptions'}</p>
          </div>
        </div>
        <div className="schools-head__side">
          <img className="schools-head__art" src="/school-illustration.svg" alt="" aria-hidden="true" width="210" height="89" />
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
            <PlusCircle size={17} aria-hidden /> Add school
          </button>
        </div>
      </div>

      <div className="schools-toolbar card">
        <div className="schools-toolbar__search">
          <label htmlFor="school-q">Search</label>
          <div className="input-icon">
            <Search size={16} aria-hidden />
            <input id="school-q" type="search" placeholder="Name, code, city or region" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="schools-toolbar__status">
          <label htmlFor="school-status">Status</label>
          <div className="input-icon">
            <SlidersHorizontal size={16} aria-hidden />
            <select id="school-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      <DataTable
        caption="Schools"
        rows={list.data?.items}
        loading={list.isLoading}
        error={list.error}
        onRetry={() => list.refetch()}
        fetching={list.isFetching && !list.isLoading}
        rowKey={(s) => s._id}
        emptyTitle={q || status ? 'No schools match these filters' : 'No schools yet'}
        emptyMessage={q || status ? 'Try a different search or status.' : 'Add the first school to get started.'}
        columns={[
          {
            key: 'name',
            header: 'School',
            render: (s) => (
              <div className="school-cell">
                <span className="school-avatar" aria-hidden="true">
                  <School size={18} />
                </span>
                <div>
                  <Link to={`/super/schools/${s._id}`}>
                    <strong>{s.name}</strong>
                  </Link>
                  <div className="muted small mono">{s.schoolCode}</div>
                </div>
              </div>
            ),
          },
          {
            key: 'location',
            header: 'Location',
            render: (s) => (
              <span className="cell-icon">
                <MapPin size={15} aria-hidden />
                {[s.city, s.region].filter(Boolean).join(', ') || '—'}
              </span>
            ),
            hideSm: true,
          },
          {
            key: 'students',
            header: 'Students',
            render: (s) => (
              <span className="cell-icon">
                <Users size={15} aria-hidden />
                {num(s.studentCount)}
              </span>
            ),
          },
          {
            key: 'teachers',
            header: 'Teachers',
            render: (s) => (
              <span className="cell-icon">
                <Users size={15} aria-hidden />
                {num(s.teacherCount)}
              </span>
            ),
            hideSm: true,
          },
          {
            key: 'classes',
            header: 'Classes',
            render: (s) =>
              s.enabledClasses.length ? (
                <span className="cell-icon">
                  <LayoutGrid size={15} aria-hidden />
                  {classLevels(s.enabledClasses)}
                </span>
              ) : (
                <span className="muted">None granted</span>
              ),
          },
          {
            key: 'plan',
            header: 'Plan',
            render: (s) =>
              s.plan ? (
                <div className="stack stack--sm" style={{ gap: 3 }}>
                  <PlanBadge name={s.plan.name} />
                  <span className="muted small">
                    {s.plan.status} · until {date(s.plan.endDate)}
                  </span>
                </div>
              ) : (
                <span className="muted">No plan</span>
              ),
          },
          { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (s) => (
              <Link className="btn btn--secondary btn--sm" to={`/super/schools/${s._id}`}>
                Manage
              </Link>
            ),
          },
        ]}
        pagination={list.data ? { page: list.data.page, totalPages: list.data.totalPages, total: list.data.total, pageSize: list.data.pageSize, onPage: setPage } : undefined}
      />
      <SchoolFormModal open={adding} onClose={() => setAdding(false)} onSaved={(s) => navigate(`/super/schools/${s._id}`)} />
    </div>
  );
}
