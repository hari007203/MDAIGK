import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Award,
  BookOpen,
  Building2,
  CreditCard,
  Crown,
  FileBarChart,
  GraduationCap,
  Layers,
  PlusCircle,
  Rocket,
  Users,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useGet } from '../../api/hooks';
import type { PlatformAnalytics } from '../../api/types';
import { Card, ChartCard, StatCard, StatGrid } from '../../components/Cards';
import { QueryState } from '../../components/Feedback';
import { DataTable } from '../../components/DataTable';
import { Badge, PremiumBadge, StatusBadge } from '../../components/Badge';
import { CHART, axisProps, pctTick, tooltipProps } from '../../components/charts';
import { dateTime, monthLabel, num, pct } from '../../lib/format';

export default function PlatformOverview() {
  const q = useGet<PlatformAnalytics>('/analytics/platform');
  const navigate = useNavigate();
  return (
    <div className="super-overview">
      <section className="super-overview-heading" aria-labelledby="platform-overview-title">
        <div className="super-overview-heading__copy">
          <span className="super-overview-heading__eyebrow">Super Admin</span>
          <h1 id="platform-overview-title">Platform Overview</h1>
          <p>A complete view of schools, users, learning activity and platform performance.</p>
        </div>
        <SchoolScene />
        <button type="button" className="btn btn--primary super-overview-heading__action" onClick={() => navigate('/super/schools?new=1')}>
          <PlusCircle size={16} aria-hidden /> Add school
        </button>
      </section>
      <QueryState query={q} loadingLabel="Loading platform metrics…">
        {(d) => <Overview data={d} />}
      </QueryState>
    </div>
  );
}

function SchoolScene() {
  return (
    <svg className="super-school-scene" viewBox="0 0 440 140" role="img" aria-label="Illustration of a school surrounded by trees">
      <path d="M8 128c35-24 66-17 96-6 27-27 59-22 83-7 28-26 62-18 82-4 23-21 54-22 78-2 29-19 60-13 85 4v27H8z" fill="#e5f3e4" />
      <path d="M43 120c-8-21 10-34 26-28 2-20 34-23 39 0 17-3 27 11 22 28zM318 119c-8-18 8-29 22-24 3-19 32-20 36 0 16-2 24 11 19 24z" fill="#d5edd2" />
      <g fill="#20804f">
        <path d="M105 115V78c0-13 12-24 24-24s24 11 24 24v37zM289 115V73c0-14 12-26 25-26s25 12 25 26v42z" />
        <path d="M119 73h20v42h-20zM303 68h22v47h-22z" fill="#126b49" />
      </g>
      <g stroke="#126b49" strokeWidth="3" strokeLinecap="round">
        <path d="M131 88v27M314 78v37" />
        <path d="M131 96l-12-9M131 101l12-11M314 91l-11-9M314 98l12-10" />
      </g>
      <path d="M164 119V62l56-37 56 37v57z" fill="#fffdf5" stroke="#d7dfd1" strokeWidth="3" />
      <path d="M154 64l66-45 66 45h-30l-36-24-36 24z" fill="#ffc928" stroke="#e6ae16" strokeWidth="3" />
      <path d="M201 119V91a19 19 0 0 1 38 0v28z" fill="#126b49" />
      <path d="M178 70h17v17h-17zM205 70h17v17h-17zM232 70h17v17h-17z" fill="#b9e0ee" stroke="#fff" strokeWidth="3" />
      <path d="M216 18V7h5v11" stroke="#126b49" strokeWidth="3" />
      <path d="M221 7h19l-5 7 5 7h-19z" fill="#f2a51c" />
      <path d="M159 120h121" stroke="#e2b121" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function Overview({ data: d }: { data: PlatformAnalytics }) {
  const t = d.totals;
  const growth = d.growth.students.map((s, i) => ({
    month: monthLabel(s.month),
    students: s.cumulative,
    schools: d.growth.schools[i]?.cumulative ?? 0,
    teachers: d.growth.teachers[i]?.cumulative ?? 0,
  }));
  const subjects = d.subjects.map((s) => ({ name: s.name, average: s.averagePercent, n: s.sampleSize }));
  const programmes = d.programmes.map((p) => ({ name: p.name.replace(' Programme', ''), enrolled: p.enrolled, completed: p.completed, premium: p.premium }));
  const activity = d.activity.map((a) => ({ ...a, label: a.date.slice(5) }));
  const activityTotal = d.activity.reduce((s, a) => s + a.quizAttempts + a.gameAttempts, 0);

  return (
    <div className="stack">
      <p className="period-banner">
        <Activity size={14} aria-hidden /> Totals: all time · Growth: last 12 months · Activity: last 30 days · Generated {dateTime(d.period.generatedAt)}
      </p>
      <StatGrid>
        <StatCard label="Total schools" value={num(t.schools)} hint="All time" icon={Building2} />
        <StatCard label="Active schools" value={num(t.activeSchools)} hint={`of ${num(t.schools)} schools`} icon={Building2} tone="positive" />
        <StatCard label="Students" value={num(t.students)} hint="Active student profiles" icon={GraduationCap} />
        <StatCard label="Teachers" value={num(t.teachers)} hint="Active teacher memberships" icon={Users} />
        <StatCard label="Enabled classes" value={num(t.enabledClasses)} hint={`School × class grants (Classes 1–${t.classLevelsAvailable})`} icon={Layers} />
        <StatCard label="Premium schools" value={num(t.premiumSchools)} hint="With an active premium academy" icon={Crown} tone="gold" />
        <StatCard label="Programme enrolments" value={num(t.programmeEnrolments)} hint="All time" icon={Rocket} />
        <StatCard
          label="Avg performance"
          value={pct(t.averagePerformancePercent)}
          hint={t.performanceSampleSize ? `All time · n = ${num(t.performanceSampleSize)} attempts` : 'No scored attempts yet'}
          icon={Award}
          tone="positive"
        />
      </StatGrid>

      <div className="grid-2">
        <ChartCard title="Growth: students, schools & teachers" period="Cumulative, last 12 months" empty={!growth.length}>
          <ResponsiveContainer>
            <LineChart data={growth} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis yAxisId="l" allowDecimals={false} {...axisProps} />
              <YAxis yAxisId="r" orientation="right" allowDecimals={false} {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend />
              <Line yAxisId="l" type="monotone" dataKey="students" name="Students" stroke={CHART.primary} strokeWidth={2.5} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="schools" name="Schools (right axis)" stroke={CHART.gold} strokeWidth={2} dot={false} />
              <Line yAxisId="r" type="monotone" dataKey="teachers" name="Teachers (right axis)" stroke={CHART.info} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Subject averages"
          period="All time · average attempt score"
          empty={subjects.every((s) => s.average === null)}
          footer={`Sample sizes: ${d.subjects.map((s) => `${s.code} n=${s.sampleSize}`).join(' · ')}`}
        >
          <ResponsiveContainer>
            <BarChart data={subjects} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="name" {...axisProps} interval={0} tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)} />
              <YAxis domain={[0, 100]} tickFormatter={pctTick} {...axisProps} />
              <Tooltip {...tooltipProps} formatter={(v: number, _n, item) => [`${v ?? '—'}% (n=${(item.payload as { n: number }).n})`, 'Average']} />
              <Bar dataKey="average" name="Average %" fill={CHART.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Programme enrolments" period="All time" empty={programmes.every((p) => p.enrolled === 0)} emptyMessage="No programme enrolments yet.">
          <ResponsiveContainer>
            <BarChart data={programmes} layout="vertical" margin={{ top: 8, right: 16, left: 24, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...axisProps} />
              <YAxis type="category" dataKey="name" width={130} {...axisProps} />
              <Tooltip {...tooltipProps} />
              <Legend />
              <Bar dataKey="enrolled" name="Enrolled" fill={CHART.gold} radius={[0, 4, 4, 0]} />
              <Bar dataKey="completed" name="Completed" fill={CHART.primary} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Daily learning activity"
          period="Last 30 days · quiz attempts and games started"
          empty={activityTotal === 0}
          emptyMessage="No learning activity in the last 30 days."
        >
          <ResponsiveContainer>
            <BarChart data={activity} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" {...axisProps} interval={4} />
              <YAxis allowDecimals={false} {...axisProps} />
              <Tooltip {...tooltipProps} labelFormatter={(_l, p) => (p?.[0]?.payload as { date?: string })?.date ?? ''} />
              <Legend />
              <Bar dataKey="quizAttempts" name="Quiz attempts" stackId="a" fill={CHART.primary} />
              <Bar dataKey="gameAttempts" name="Game attempts" stackId="a" fill={CHART.secondary} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid-2-1">
        <Card title="Recent schools" subtitle="Newest 8 schools" actions={<Link to="/super/schools">View all</Link>}>
          <DataTable
            caption="Recent schools"
            rows={d.recentSchools}
            rowKey={(s) => s.id}
            emptyTitle="No schools yet"
            emptyMessage="Add the first school to get started."
            columns={[
              {
                key: 'name',
                header: 'School',
                render: (s) => (
                  <div>
                    <Link to={`/super/schools/${s.id}`}>
                      <strong>{s.name}</strong>
                    </Link>
                    <div className="muted small mono">{s.schoolCode}</div>
                  </div>
                ),
              },
              { key: 'location', header: 'Location', render: (s) => s.location || '—', hideSm: true },
              { key: 'students', header: 'Students', align: 'right', render: (s) => num(s.students) },
              {
                key: 'plan',
                header: 'Plan',
                render: (s) =>
                  s.plan ? (
                    s.plan === 'Premium' ? (
                      <PremiumBadge label="Premium" />
                    ) : (
                      <Badge tone="outline">{s.plan}</Badge>
                    )
                  ) : (
                    <span className="muted">No plan</span>
                  ),
              },
              { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
              {
                key: 'actions',
                header: <span className="sr-only">Actions</span>,
                align: 'right',
                render: (s) => (
                  <Link className="btn btn--ghost btn--sm" to={`/super/schools/${s.id}`}>
                    Manage
                  </Link>
                ),
              },
            ]}
          />
        </Card>
        <Card title="Quick actions">
          <div className="quick-actions">
            <Link className="quick-action" to="/super/schools?new=1">
              <Building2 size={18} aria-hidden /> Add school
            </Link>
            <Link className="quick-action" to="/super/plans?new=1">
              <CreditCard size={18} aria-hidden /> Create plan
            </Link>
            <Link className="quick-action" to="/super/users">
              <Users size={18} aria-hidden /> Manage users
            </Link>
            <Link className="quick-action" to="/super/content/learning">
              <BookOpen size={18} aria-hidden /> Manage content
            </Link>
            <Link className="quick-action" to="/super/schools">
              <FileBarChart size={18} aria-hidden /> View reports
            </Link>
            <Link className="quick-action" to="/super/audit">
              <Activity size={18} aria-hidden /> Audit log
            </Link>
          </div>
          <p className="muted small" style={{ marginTop: 12 }}>
            School-level reports (class, subject, games, certificates, programmes, students) are available from each school's detail page.
          </p>
        </Card>
      </div>
    </div>
  );
}
