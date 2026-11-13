import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Ban, CalendarDays, CheckCircle2, Crown, GraduationCap, Key, Presentation, Search, ShieldCheck, UserCheck, UserCog, UserPlus, Users } from 'lucide-react';
import { ROLES } from '@mango/shared';
import { ApiError, api, errorMessage } from '../../api/client';
import { useGet, useInvalidate, useMutate } from '../../api/hooks';
import type { Paginated, PlatformUser } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { DataTable } from '../../components/DataTable';
import { FormField, FormGrid } from '../../components/Form';
import { InlineAlert } from '../../components/Feedback';
import { ConfirmDialog, Modal, SecretDialog } from '../../components/Modal';
import { StatusBadge } from '../../components/Badge';
import { useToast } from '../../components/Toast';
import { dateTime, num, titleCase } from '../../lib/format';
import { useDebounced } from '../../lib/useDebounced';

type Pending = { kind: 'status' | 'reset'; user: PlatformUser } | null;

const AVATAR_TONES = [
  { bg: '#e8f3e8', fg: '#126b49' },
  { bg: '#fdeec2', fg: '#8a6400' },
  { bg: '#e3f0fd', fg: '#1d5fa8' },
  { bg: '#efe9f7', fg: '#5b3e8c' },
  { bg: '#ededed', fg: '#4a4f4a' },
];

function avatarTone(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_TONES[Math.abs(h) % AVATAR_TONES.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function RoleBadge({ role }: { role: string }) {
  let icon: ReactNode = <GraduationCap size={12} aria-hidden />;
  let cls = 'users-role--student';
  if (role === ROLES.SUPER_ADMIN) {
    icon = <Crown size={12} aria-hidden />;
    cls = 'users-role--super';
  } else if (role === ROLES.SCHOOL_ADMIN) {
    icon = <ShieldCheck size={12} aria-hidden />;
    cls = 'users-role--admin';
  } else if (role === ROLES.TEACHER) {
    icon = <Presentation size={12} aria-hidden />;
    cls = 'users-role--teacher';
  }
  return (
    <span className={`badge users-role ${cls}`}>
      {icon} {titleCase(role)}
    </span>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<Pending>(null);
  const [secret, setSecret] = useState<{ value: string; who: string; label: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const q = useDebounced(search.trim());
  useEffect(() => setPage(1), [q, role, status]);
  const list = useGet<Paginated<PlatformUser>>('/users', { q, role, status, page, pageSize: 25 });

  const totalQ = useGet<Paginated<PlatformUser>>('/users', { pageSize: 1 });
  const activeQ = useGet<Paginated<PlatformUser>>('/users', { pageSize: 1, status: 'active' });
  const studentsQ = useGet<Paginated<PlatformUser>>('/users', { pageSize: 1, role: ROLES.STUDENT });
  const teachersQ = useGet<Paginated<PlatformUser>>('/users', { pageSize: 1, role: ROLES.TEACHER });
  const adminsQ = useGet<Paginated<PlatformUser>>('/users', { pageSize: 1, role: ROLES.SCHOOL_ADMIN });

  const toggle = useMutate((u: PlatformUser) => api.patch(`/users/${u.id}`, { status: u.status === 'active' ? 'inactive' : 'active' }), {
    invalidate: ['/users'],
    success: 'User status updated',
    onSuccess: () => setPending(null),
  });
  const reset = useMutate((u: PlatformUser) => api.post<{ temporaryPassword: string }>(`/users/${u.id}/reset-password`), {
    invalidate: ['/users'],
    onSuccess: (res) => {
      const u = pending!.user;
      setSecret({ value: res.temporaryPassword, who: `${u.name}${u.email ? ` (${u.email})` : ''}`, label: u.role === ROLES.STUDENT ? 'PIN' : 'Temporary password' });
      setPending(null);
    },
  });

  return (
    <div className="users-page">
      <div className="users-head">
        <div className="users-head__title">
          <span className="users-head__icon" aria-hidden="true">
            <UserCog size={26} />
          </span>
          <div>
            <h1>Users</h1>
            <p className="users-head__sub">Manage platform users, school administrators, teachers and students.</p>
            {list.data && <p className="users-head__count" aria-live="polite">{num(list.data.total)} users match the current filters</p>}
          </div>
        </div>
        <div className="users-head__side">
          <img className="users-head__art" src="/users-illustration.svg" alt="" aria-hidden="true" width="230" height="88" />
          <button type="button" className="btn btn--primary" onClick={() => setAdding(true)}>
            <UserPlus size={17} aria-hidden /> Add user
          </button>
        </div>
      </div>

      <div className="users-stats">
        <div className="users-stat">
          <span className="users-stat__icon users-stat__icon--green" aria-hidden="true">
            <Users size={22} />
          </span>
          <div>
            <p className="users-stat__label">Total Users</p>
            <p className="users-stat__value">{totalQ.data ? num(totalQ.data.total) : '–'}</p>
          </div>
        </div>
        <div className="users-stat users-stat--mint">
          <span className="users-stat__icon users-stat__icon--mint" aria-hidden="true">
            <UserCheck size={22} />
          </span>
          <div>
            <p className="users-stat__label">Active Users</p>
            <p className="users-stat__value">{activeQ.data ? num(activeQ.data.total) : '–'}</p>
          </div>
        </div>
        <div className="users-stat users-stat--gold">
          <span className="users-stat__icon users-stat__icon--gold" aria-hidden="true">
            <GraduationCap size={22} />
          </span>
          <div>
            <p className="users-stat__label">Students</p>
            <p className="users-stat__value">{studentsQ.data ? num(studentsQ.data.total) : '–'}</p>
          </div>
        </div>
        <div className="users-stat">
          <span className="users-stat__icon users-stat__icon--gold" aria-hidden="true">
            <Presentation size={22} />
          </span>
          <div>
            <p className="users-stat__label">Teachers</p>
            <p className="users-stat__value">{teachersQ.data ? num(teachersQ.data.total) : '–'}</p>
          </div>
        </div>
        <div className="users-stat users-stat--gold">
          <span className="users-stat__icon users-stat__icon--gold" aria-hidden="true">
            <ShieldCheck size={22} />
          </span>
          <div>
            <p className="users-stat__label">School Admins</p>
            <p className="users-stat__value">{adminsQ.data ? num(adminsQ.data.total) : '–'}</p>
          </div>
        </div>
      </div>

      <div className="users-toolbar card">
        <div className="users-toolbar__search">
          <label htmlFor="u-q">Search</label>
          <div className="input-icon">
            <Search size={16} aria-hidden />
            <input id="u-q" type="search" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="users-toolbar__filter">
          <label htmlFor="u-role">Role</label>
          <div className="input-icon">
            <Users size={16} aria-hidden />
            <select id="u-role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>
                  {titleCase(r)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="users-toolbar__filter">
          <label htmlFor="u-status">Status</label>
          <div className="input-icon">
            <CheckCircle2 size={16} aria-hidden />
            <select id="u-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable
        caption="Users"
        rows={list.data?.items}
        loading={list.isLoading}
        error={list.error}
        onRetry={() => list.refetch()}
        fetching={list.isFetching && !list.isLoading}
        rowKey={(u) => u.id}
        emptyTitle="No users match these filters"
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (u) => {
              const tone = avatarTone(u.name);
              return (
                <div className="users-cell">
                  <span className="users-avatar" style={{ background: tone.bg, color: tone.fg }} aria-hidden="true">
                    {initials(u.name)}
                  </span>
                  <div className="users-cell__text">
                    <strong>{u.name}</strong>
                    <div className="muted small users-cell__email">{u.email ?? 'No email (student)'}</div>
                  </div>
                </div>
              );
            },
          },
          { key: 'role', header: 'Role', render: (u) => <RoleBadge role={u.role} /> },
          {
            key: 'schools',
            header: 'Schools',
            render: (u) =>
              u.schools.length ? (
                <div className="users-schools">
                  {u.schools.map((s, i) => (
                    <span key={i} className="school-chip">
                      {s.school?.schoolCode ?? '—'}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="muted">—</span>
              ),
            hideSm: true,
          },
          {
            key: 'login',
            header: 'Last sign-in',
            render: (u) => (
              <span className="cell-icon">
                <CalendarDays size={15} aria-hidden />
                {dateTime(u.lastLoginAt)}
              </span>
            ),
            hideSm: true,
          },
          { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
          {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            render: (u) =>
              u.id === me?.id ? (
                <span className="muted small">You</span>
              ) : (
                <div className="users-actions">
                  <button type="button" className="btn btn--secondary btn--sm users-act users-act--reset" onClick={() => setPending({ kind: 'reset', user: u })}>
                    <Key size={13} aria-hidden /> {u.role === ROLES.STUDENT ? 'Reset PIN' : 'Reset password'}
                  </button>
                  <button
                    type="button"
                    className={`btn btn--sm users-act ${u.status === 'active' ? 'users-act--danger' : 'users-act--reset'}`}
                    onClick={() => setPending({ kind: 'status', user: u })}
                  >
                    <Ban size={13} aria-hidden /> {u.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ),
          },
        ]}
        pagination={
          list.data
            ? { page: list.data.page, totalPages: list.data.totalPages, total: list.data.total, pageSize: list.data.pageSize, onPage: setPage, numbered: true, totalLabel: 'users' }
            : undefined
        }
      />
      <ConfirmDialog
        open={pending?.kind === 'status'}
        title={pending?.user.status === 'active' ? 'Deactivate user?' : 'Activate user?'}
        message={
          pending?.user.status === 'active'
            ? `${pending.user.name} will be signed out everywhere and can no longer sign in.`
            : `${pending?.user.name} will be able to sign in again.`
        }
        confirmLabel={pending?.user.status === 'active' ? 'Deactivate' : 'Activate'}
        tone={pending?.user.status === 'active' ? 'danger' : 'primary'}
        busy={toggle.isPending}
        onConfirm={() => pending && toggle.mutate(pending.user)}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending?.kind === 'reset'}
        title={pending?.user.role === ROLES.STUDENT ? 'Reset PIN?' : 'Reset password?'}
        message={`A new one-time ${pending?.user.role === ROLES.STUDENT ? 'PIN' : 'temporary password'} will be generated for ${pending?.user.name}. Their current sessions will be signed out.`}
        confirmLabel="Reset"
        tone="danger"
        busy={reset.isPending}
        onConfirm={() => pending && reset.mutate(pending.user)}
        onCancel={() => setPending(null)}
      />
      <SecretDialog secret={secret?.value} label={secret?.label ?? 'Temporary password'} subject={secret?.who} onClose={() => setSecret(null)} />
      <AddUserModal open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function AddUserModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const invalidate = useInvalidate();
  const toast = useToast();
  useEffect(() => {
    if (!open) return;
    setF({ name: '', email: '', password: '' });
    setErrors({});
    setFormError(null);
  }, [open]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (f.name.trim().length < 2) v.name = 'Name is required (2–120 characters)';
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) v.email = 'Enter a valid email address';
    if (f.password.length < 10) v.password = 'Password must be at least 10 characters';
    setErrors(v);
    setFormError(null);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      await api.post('/users', { name: f.name.trim(), email: f.email.trim(), password: f.password });
      await invalidate('/users');
      toast.success('User created');
      onClose();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fieldErrors);
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Add user"
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="add-user-form" className="btn btn--primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create user'}
          </button>
        </>
      }
    >
      <form id="add-user-form" onSubmit={submit} noValidate>
        {formError && <InlineAlert>{formError}</InlineAlert>}
        <InlineAlert tone="info">This creates a Super Admin account. School admins, teachers and students are created inside their school.</InlineAlert>
        <FormGrid>
          <FormField label="Name" error={errors.name} required>
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={120} autoComplete="name" data-autofocus />
          </FormField>
          <FormField label="Email" error={errors.email} required>
            <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
          </FormField>
        </FormGrid>
        <FormField label="Password" error={errors.password} hint="Minimum 10 characters. The user signs in with this password." required>
          <input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" />
        </FormField>
      </form>
    </Modal>
  );
}
