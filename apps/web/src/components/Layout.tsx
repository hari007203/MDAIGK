import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  BarChart3,
  Bell,
  CheckSquare,
  Home,
  Lightbulb,
  LineChart,
  Sparkles,
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileBarChart,
  Gamepad2,
  GraduationCap,
  History,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Newspaper,
  Rocket,
  Search,
  Settings,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import './StudentSidebar.css';
import './SchoolSidebar.css';
import { ROLES } from '@mango/shared';
import { useAuth } from '../auth/AuthContext';
import { useGet } from '../api/hooks';
import type { Paginated, Notification } from '../api/types';
import { dateTime } from '../lib/format';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}
interface NavGroup {
  heading?: string;
  items: NavItem[];
}

export const SUPER_NAV: NavGroup[] = [
  {
    items: [
      { to: '/super', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/super/schools', label: 'Schools', icon: Building2 },
      { to: '/super/plans', label: 'Plans', icon: CreditCard },
      { to: '/super/users', label: 'Users', icon: Users },
    ],
  },
  {
    heading: 'Content',
    items: [
      { to: '/super/content/subjects', label: 'Subjects', icon: Layers },
      { to: '/super/content/learning', label: 'Learning items', icon: BookOpen },
      { to: '/super/content/news', label: 'News', icon: Newspaper },
      { to: '/super/content/quizzes', label: 'Quizzes', icon: ClipboardList },
      { to: '/super/content/games', label: 'Games', icon: Gamepad2 },
      { to: '/super/content/programmes', label: 'Programmes', icon: Rocket },
      { to: '/super/content/certifications', label: 'Certification', icon: Award },
    ],
  },
  {
    heading: 'Platform',
    items: [
      { to: '/super/audit', label: 'Audit log', icon: History },
      { to: '/super/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const SCHOOL_NAV: NavGroup[] = [
  {
    items: [
      { to: '/school', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/school/classes', label: 'Classes & sections', icon: Layers },
      { to: '/school/teachers', label: 'Teachers', icon: Users },
      { to: '/school/students', label: 'Students', icon: GraduationCap },
      { to: '/school/reports', label: 'Reports', icon: FileBarChart },
      { to: '/school/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const TEACHER_NAV: NavGroup[] = [
  {
    items: [
      { to: '/teacher/home', label: 'Home', icon: LayoutDashboard },
      { to: '/teacher/classes', label: 'My classes', icon: GraduationCap },
      { to: '/teacher/activities', label: 'Activities', icon: ClipboardList },
      { to: '/teacher/performance', label: 'Performance', icon: BarChart3 },
      { to: '/teacher/insights', label: 'Insights', icon: Lightbulb },
      { to: '/teacher/quizzes', label: 'My quizzes', icon: CheckSquare },
    ],
  },
];

export const STUDENT_NAV: NavGroup[] = [
  {
    items: [
      { to: '/student/home', label: 'Home', icon: Home },
      { to: '/student/activities', label: 'My activities', icon: ClipboardList },
      { to: '/student/learn', label: 'Learn', icon: BookOpen },
      { to: '/student/news', label: 'News & GK', icon: Newspaper },
      { to: '/student/games', label: 'Games', icon: Gamepad2 },
      { to: '/student/programmes', label: 'Programmes', icon: Sparkles },
      { to: '/student/certificates', label: 'Certificates', icon: Award },
      { to: '/student/progress', label: 'My progress', icon: LineChart },
      { to: '/student/profile', label: 'Profile', icon: UserCircle },
    ],
  },
];

const ROLE_LABEL: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.SCHOOL_ADMIN]: 'School Admin',
  [ROLES.TEACHER]: 'Teacher',
  [ROLES.STUDENT]: 'Student',
};

function navFor(role: string | undefined): NavGroup[] {
  if (role === ROLES.SUPER_ADMIN) return SUPER_NAV;
  if (role === ROLES.TEACHER) return TEACHER_NAV;
  if (role === ROLES.STUDENT) return STUDENT_NAV;
  return SCHOOL_NAV;
}

function Logo({ student = false }: { student?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="Mango Dude AIGK home">
      <img
        className={`brand__mark${student ? ' student-sidebar__logo' : ''}`}
        src="/assets/mango-dude-symbol.png"
        alt=""
        aria-hidden="true"
      />
      <span className="brand__text">
        Mango Dude <small>AIGK</small>
      </span>
    </Link>
  );
}

export function Sidebar({ groups, open, onClose }: { groups: NavGroup[]; open: boolean; onClose: () => void }) {
  const isSuperAdmin = groups === SUPER_NAV;
  const isSchoolAdmin = groups === SCHOOL_NAV;
  const isStudent = groups === STUDENT_NAV;
  const settingsItem = isSuperAdmin ? groups.flatMap((group) => group.items).find((item) => item.to === '/super/settings') : undefined;
  const visibleGroups = isSuperAdmin
    ? groups.map((group) => ({ ...group, items: group.items.filter((item) => item.to !== '/super/settings') })).filter((group) => group.items.length > 0)
    : isStudent ? groups.map((group) => ({ ...group, items: group.items.filter((item) => item.to !== '/student/profile') })) : groups;
  return (
    <>
      <aside className={`sidebar ${isSuperAdmin ? 'sidebar--super' : ''} ${isSchoolAdmin ? 'sidebar--school' : ''} ${open ? 'sidebar--open' : ''}`} aria-label="Main navigation">
        <div className="sidebar__head">
          <Logo student={isStudent} />
          <button type="button" className="icon-btn sidebar__close" onClick={onClose} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        <nav className={isStudent ? 'student-sidebar__body' : undefined}>
          {visibleGroups.map((g, i) => (
            <div key={i} className="nav-group">
              {g.heading && <p className="nav-group__heading">{g.heading}</p>}
              <ul>
                {g.items.map((it) => (
                  <li key={it.to}>
                    <NavLink to={it.to} end={it.end} className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={onClose}>
                      <it.icon size={18} aria-hidden />
                      <span>{isStudent && it.to === '/student/activities' ? 'My Activities' : isStudent && it.to === '/student/progress' ? 'My Progress' : it.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {isStudent && (
            <div className="student-home-sidebar-card">
              <img src="/assets/student-home/sidebar-trophy.png" width="230" height="90" alt="" />
              <h2>Keep Learning!</h2>
              <p>You’re doing great!</p>
            </div>
          )}
        </nav>
        {isStudent && (
          <div className="student-sidebar__footer">
            <NavLink to="/student/profile" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={onClose}>
              <UserCircle size={18} aria-hidden /><span>Profile</span>
            </NavLink>
          </div>
        )}
        {settingsItem && (
          <div className="sidebar__footer">
            <NavLink to={settingsItem.to} end={settingsItem.end} className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`} onClick={onClose}>
              <settingsItem.icon size={18} aria-hidden />
              <span>{settingsItem.label}</span>
            </NavLink>
          </div>
        )}
      </aside>
      {open && <div className="sidebar-scrim" onClick={onClose} aria-hidden />}
    </>
  );
}

function useClickOutside(onOutside: () => void, active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onOutside();
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', k);
    };
  }, [active, onOutside]);
  return ref;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function useMenuPresence(open: boolean, animate: boolean) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!animate) {
      setMounted(false);
      return;
    }
    if (!mounted) return;
    const timeout = window.setTimeout(() => setMounted(false), 160);
    return () => window.clearTimeout(timeout);
  }, [open, animate, mounted]);
  return { render: open || (animate && mounted), closing: animate && !open && mounted };
}

function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const isSuper = user?.role === ROLES.SUPER_ADMIN;
  const menu = useMenuPresence(open, isSuper && !prefersReducedMotion());
  const q = useGet<Paginated<Notification> & { unread: number }>('/notifications', { pageSize: 5 }, { refetchInterval: 60_000 });
  const ref = useClickOutside(() => setOpen(false), open);
  const unread = q.data?.unread ?? 0;
  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="icon-btn topbar__icon"
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={20} />
        {unread > 0 && <span className="dot-count">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {menu.render && (
        <div className={`dropdown__menu dropdown__menu--wide${isSuper ? ' dropdown__menu--super' : ''}${menu.closing ? ' is-closing' : ''}`} aria-hidden={menu.closing} inert={menu.closing}>
          <p className="dropdown__title">Notifications</p>
          {q.isLoading && <p className="muted pad">Loading…</p>}
          {q.isError && <p className="pad text-danger">Could not load notifications.</p>}
          {q.data && q.data.items.length === 0 && <p className="muted pad">You're all caught up.</p>}
          <ul className="notif-list">
            {q.data?.items.map((n) => (
              <li key={n._id} className={n.readAt ? '' : 'notif--unread'}>
                <strong>{n.title}</strong>
                {n.body && <span>{n.body}</span>}
                <small>{dateTime(n.createdAt)}</small>
              </li>
            ))}
          </ul>
          <Link to="/notifications" className="dropdown__footer" onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

function UserMenu({ studentHome = false }: { studentHome?: boolean }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isSuper = user?.role === ROLES.SUPER_ADMIN;
  const menu = useMenuPresence(open, isSuper && !prefersReducedMotion());
  const ref = useClickOutside(() => setOpen(false), open);
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="user-btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden>
          {user.name.charAt(0)}
        </span>
        <span className="user-btn__text">
          {studentHome ? <><small>Welcome back,</small><strong>{user.name}!</strong></> : <><strong>{user.name}</strong><small>{ROLE_LABEL[user.role] ?? user.role}</small></>}
        </span>
        <ChevronDown size={16} aria-hidden />
      </button>
      {menu.render && (
        <div className={`dropdown__menu${isSuper ? ' dropdown__menu--super' : ''}${menu.closing ? ' is-closing' : ''}`} role="menu" aria-hidden={menu.closing} inert={menu.closing}>
          <Link role="menuitem" to={user.role === ROLES.STUDENT ? '/student/profile' : '/profile'} className="dropdown__item" onClick={() => setOpen(false)}>
            <UserCircle size={16} aria-hidden /> {user.role === ROLES.STUDENT ? 'My profile' : 'Profile & password'}
          </Link>
          <button
            role="menuitem"
            type="button"
            className="dropdown__item"
            onClick={async () => {
              setOpen(false);
              await logout();
              navigate('/login', { replace: true });
            }}
          >
            <LogOut size={16} aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function SchoolSwitcher() {
  const { adminSchools, activeSchoolId, setActiveSchoolId } = useAuth();
  const active = adminSchools.find((s) => s.schoolId === activeSchoolId);
  if (adminSchools.length <= 1) {
    return active ? (
      <div className="school-pill" title={active.schoolCode}>
        <Building2 size={16} aria-hidden /> {active.schoolName}
      </div>
    ) : null;
  }
  return (
    <label className="school-switcher">
      <Building2 size={16} aria-hidden />
      <span className="sr-only">Active school</span>
      <select value={activeSchoolId ?? ''} onChange={(e) => setActiveSchoolId(e.target.value)}>
        {adminSchools.map((s) => (
          <option key={s.schoolId} value={s.schoolId}>
            {s.schoolName} ({s.schoolCode})
          </option>
        ))}
      </select>
    </label>
  );
}

function GlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState(() => new URLSearchParams(location.search).get('q') ?? '');
  function submit(e: FormEvent) {
    e.preventDefault();
    if (q.trim()) navigate(`/super/search?q=${encodeURIComponent(q.trim())}`);
  }
  return (
    <form className="global-search" role="search" onSubmit={submit}>
      <Search size={16} aria-hidden />
      <label htmlFor="global-search" className="sr-only">
        Search schools, users, student IDs, class sections
      </label>
      <input id="global-search" type="search" placeholder="Search schools, users, student IDs, classes (e.g. 4-A)…" value={q} onChange={(e) => setQ(e.target.value)} />
    </form>
  );
}

export function AppLayout() {
  const { user } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setNavOpen(false), [location.pathname]);
  const isSuper = user?.role === ROLES.SUPER_ADMIN;
  const isStudent = user?.role === ROLES.STUDENT;
  const isTeacher = user?.role === ROLES.TEACHER;
  const isStudentHome = isStudent && location.pathname === '/student/home';
  return (
    <div className={`app ${isSuper ? 'app--super' : ''} ${isStudent ? 'app--student' : ''} ${isTeacher ? 'app--teacher' : ''} ${isStudentHome ? 'app--student-home' : ''}`}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar groups={navFor(user?.role)} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="app__main">
        <header className="topbar">
          <button type="button" className="icon-btn topbar__menu" aria-label="Open navigation" onClick={() => setNavOpen(true)}>
            <Menu size={20} />
          </button>
          {isStudentHome ? (
            <div className="student-home-search" title="Student-wide search is not available yet">
              <Search size={22} aria-hidden />
              <input type="search" placeholder="Search activities, topics..." aria-label="Student search unavailable" disabled />
            </div>
          ) : isSuper ? <GlobalSearch /> : <SchoolSwitcher />}
          <div className="topbar__right">
            <NotificationBell />
            <UserMenu studentHome={isStudentHome} />
          </div>
        </header>
        <main id="main" className="content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
