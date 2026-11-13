import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContextProvider, type AuthState } from '../../../auth/AuthContext';
import type { StudentActivity } from '../../../api/portalTypes';

const get = vi.fn();
const post = vi.fn();
vi.mock('../../../api/client', async (orig) => {
  const actual = await orig<typeof import('../../../api/client')>();
  return {
    ...actual,
    api: {
      ...actual.api,
      get: (...a: unknown[]) => get(...a),
      post: (...a: unknown[]) => post(...a),
    },
  };
});

import StudentActivities from '../StudentActivities';

const auth: AuthState = {
  status: 'authenticated',
  user: {
    id: 'u1',
    name: 'Myra Iyer',
    role: 'STUDENT',
    status: 'active',
    schools: [{ schoolId: 'school1', schoolName: 'Green Valley School', schoolCode: 'GVS001', role: 'STUDENT' }],
  },
  activeSchoolId: 'school1',
  adminSchools: [{ schoolId: 'school1', schoolName: 'Green Valley School', schoolCode: 'GVS001', role: 'STUDENT' }],
  login: vi.fn(),
  studentLogin: vi.fn(),
  logout: vi.fn(),
  setActiveSchoolId: vi.fn(),
  refreshUser: vi.fn(),
};

const mockActivities: StudentActivity[] = [
  {
    _id: 'act1',
    type: 'worksheet',
    title: 'Algebra Practice Worksheet',
    instructions: 'Solve the given algebra problems.',
    startAt: '2026-11-01T00:00:00.000Z',
    dueAt: '2026-11-18T00:00:00.000Z',
    status: 'published',
    completed: false,
    overdue: false,
    result: null,
    subjectId: { _id: 's1', name: 'Mathematics', code: 'MATH' },
    teacherId: { _id: 't1', name: 'Ms. Priya Sharma' },
  },
  {
    _id: 'act2',
    type: 'quiz',
    title: 'Science Quiz',
    instructions: 'Test your science knowledge.',
    startAt: '2026-11-02T00:00:00.000Z',
    dueAt: '2026-11-19T00:00:00.000Z',
    status: 'published',
    completed: false,
    overdue: false,
    result: { percent: 50, score: 5, maxScore: 10 },
    quizId: { _id: 'q1', title: 'Science Quiz', version: 1 },
    subjectId: { _id: 's2', name: 'Science', code: 'SCI' },
    teacherId: { _id: 't2', name: 'Ms. Rhea Kapoor' },
  },
  {
    _id: 'act3',
    type: 'worksheet',
    title: 'GK Challenge',
    instructions: 'Answer the quiz questions.',
    startAt: '2026-11-03T00:00:00.000Z',
    dueAt: '2026-11-20T00:00:00.000Z',
    status: 'published',
    completed: true,
    completedAt: '2026-11-15T00:00:00.000Z',
    overdue: false,
    result: null,
    subjectId: { _id: 's3', name: 'General Knowledge', code: 'GK' },
    teacherId: { _id: 't3', name: 'Mr. Arjun Mehta' },
  },
];

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthContextProvider value={auth}>
        <MemoryRouter initialEntries={['/student/activities?status=pending']}>{ui}</MemoryRouter>
      </AuthContextProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  get.mockResolvedValue(mockActivities);
});

describe('StudentActivities Page', () => {
  it('renders the hero banner, summary cards, filter pills, and activity cards', async () => {
    wrap(<StudentActivities />);

    // 1. Hero banner
    expect(await screen.findByRole('heading', { level: 1, name: 'My Activities' })).toBeInTheDocument();
    expect(
      screen.getByText('Your learning journey starts here. Explore activities, complete challenges and keep growing!'),
    ).toBeInTheDocument();

    // 2. Summary cards counts
    const statsSection = await screen.findByLabelText('Activity statistics');
    expect(within(statsSection).getByText('Total Activities')).toBeInTheDocument();
    expect(within(statsSection).getByText('3')).toBeInTheDocument(); // total = 3
    expect(within(statsSection).getByText('To Do')).toBeInTheDocument();
    expect(within(statsSection).getAllByText('2')).toHaveLength(2); // to do = 2, upcoming = 2
    expect(within(statsSection).getByText('Completed')).toBeInTheDocument();
    expect(within(statsSection).getByText('1')).toBeInTheDocument(); // completed = 1
    expect(within(statsSection).getByText('Upcoming')).toBeInTheDocument();

    // 3. Filter tabs: default pending shows 2 items
    expect(screen.getByText('Algebra Practice Worksheet')).toBeInTheDocument();
    expect(screen.getByText('Science Quiz')).toBeInTheDocument();
    expect(screen.queryByText('GK Challenge')).not.toBeInTheDocument();

    // 4. Activity card details
    expect(screen.getByText('Ms. Priya Sharma')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('filters activities when clicking filter buttons', async () => {
    const user = userEvent.setup();
    wrap(<StudentActivities />);

    await screen.findByText('Algebra Practice Worksheet');

    // Click "Completed" filter
    const filterNav = screen.getByLabelText('Activity filter');
    const completedBtn = within(filterNav).getByRole('button', { name: /Completed/i });
    await user.click(completedBtn);

    await waitFor(() => {
      expect(screen.getByText('GK Challenge')).toBeInTheDocument();
    });
    expect(screen.queryByText('Algebra Practice Worksheet')).not.toBeInTheDocument();

    // Click "All" filter
    const allBtn = within(filterNav).getByRole('button', { name: /All/i });
    await user.click(allBtn);

    await waitFor(() => {
      expect(screen.getByText('Algebra Practice Worksheet')).toBeInTheDocument();
      expect(screen.getByText('Science Quiz')).toBeInTheDocument();
      expect(screen.getByText('GK Challenge')).toBeInTheDocument();
    });
  });

  it('opens completion modal when clicking Start Activity on a worksheet', async () => {
    const user = userEvent.setup();
    wrap(<StudentActivities />);

    await screen.findByText('Algebra Practice Worksheet');

    const startBtns = screen.getAllByRole('button', { name: /Start Activity/i });
    await user.click(startBtns[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Mark “Algebra Practice Worksheet” complete/i)).toBeInTheDocument();
    });
  });
});
