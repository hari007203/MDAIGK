import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { StudentHome as Home } from '../../../api/portalTypes';

const useGet = vi.fn();
vi.mock('../../../api/hooks', () => ({ useGet: (...args: unknown[]) => useGet(...args) }));

import StudentHome from '../StudentHome';

const home: Home = {
  student: { name: 'Student', studentCode: 'S1', className: 'Class 4', schoolName: 'School' },
  dailyProgress: { date: '2026-11-13', quizzes: 1, learningItems: 0, games: 0, dailyGoal: 3 },
  streak: { current: 1, activeToday: true, activeDaysInWindow: 1 },
  certification: { currentLevel: 0, certificates: 0 },
  pendingActivities: 0,
  subjects: [],
  continueLearning: null,
};
const fontsDescriptor = Object.getOwnPropertyDescriptor(document, 'fonts');
const load = vi.fn();

function renderHome() {
  return render(<MemoryRouter><StudentHome /></MemoryRouter>);
}

beforeEach(() => {
  load.mockReset().mockResolvedValue([]);
  Object.defineProperty(document, 'fonts', { configurable: true, value: { load } });
  useGet.mockReset().mockImplementation((path: string) => ({
    data: path === '/student/home' ? home : path === '/student/progress' ? {
      overall: { averagePercent: null, quizAccuracyPercent: null },
      activityCompletion: { ratePercent: null },
    } : [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }));
});

afterEach(() => {
  if (fontsDescriptor) Object.defineProperty(document, 'fonts', fontsDescriptor);
  else Reflect.deleteProperty(document, 'fonts');
});

describe('Student Home font readiness', () => {
  it('waits for every requested font weight before displaying the dashboard', async () => {
    const complete: Array<(fonts: FontFace[]) => void> = [];
    load.mockImplementation(() => new Promise<FontFace[]>((resolve) => complete.push(resolve)));
    renderHome();
    expect(screen.getByText('Preparing your dashboard…')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Student' })).not.toBeInTheDocument();
    expect(load.mock.calls.map(([font]) => font)).toEqual([
      '700 1em Nunito', '800 1em Nunito', '900 1em Nunito',
      '400 1em Inter', '500 1em Inter', '600 1em Inter', '700 1em Inter',
    ]);
    await act(async () => complete.slice(0, 6).forEach((resolve) => resolve([])));
    expect(screen.queryByRole('heading', { name: 'Student' })).not.toBeInTheDocument();
    await act(async () => complete[6]([]));
    expect(await screen.findByRole('heading', { name: 'Student' })).toBeInTheDocument();
    expect(screen.getByText('No subjects yet')).toBeInTheDocument();
    expect(useGet).toHaveBeenCalledWith('/student/home');
    expect(useGet).toHaveBeenCalledWith('/student/activities', { status: 'pending' });
  });

  it('offers retry after a font failure without displaying fallback dashboard text', async () => {
    load.mockRejectedValueOnce(new Error('Font download failed'));
    renderHome();
    expect(await screen.findByText('Could not load dashboard fonts')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Student' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled();
  });

  it('preserves data errors after fonts are ready', async () => {
    const refetch = vi.fn();
    useGet.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error('Data unavailable'), refetch });
    renderHome();
    expect(await screen.findByText('Data unavailable')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders exactly five ordered shortcuts and retains supplemental routes', async () => {
    renderHome();
    const shortcuts = await screen.findByRole('navigation', { name: 'Quick links' });
    expect(within(shortcuts).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/student/activities', '/student/learn', '/student/games', '/student/certificates', '/student/progress',
    ]);
    expect(screen.getByRole('heading', { name: 'Dream Big, Learn More!' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Learning' })).toHaveAttribute('href', '/student/learn');
    expect(screen.getByRole('link', { name: 'My profile' })).toHaveAttribute('href', '/student/profile');
  });

  it('uses real scores and leaves unavailable Games metrics unset', async () => {
    useGet.mockImplementation((path: string) => ({
      data: path === '/student/home' ? home : path === '/student/progress' ? {
        overall: { averagePercent: 62, quizAccuracyPercent: 57 },
        activityCompletion: { ratePercent: 40 },
      } : [],
      isLoading: false, isError: false, refetch: vi.fn(),
    }));
    renderHome();
    const ring = await screen.findByRole('progressbar', { name: 'All-time quiz and assessment score' });
    expect(ring).toHaveAttribute('aria-valuenow', '62');
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByText('57%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByTitle('A Games percentage is not provided by the existing API')).toHaveTextContent('Games—');
    expect(useGet).toHaveBeenCalledWith('/student/progress', { range: 'all' });
  });

  it('preserves quiz activity IDs and actual pending activity titles', async () => {
    useGet.mockImplementation((path: string) => ({
      data: path === '/student/home' ? home : path === '/student/progress' ? {
        overall: { averagePercent: null, quizAccuracyPercent: null },
      } : [{ _id: 'activity-1', type: 'quiz', quizId: { _id: 'quiz-1' }, title: 'Real teacher quiz', dueAt: '2026-11-15T10:00:00Z', overdue: true }],
      isLoading: false, isError: false, refetch: vi.fn(),
    }));
    renderHome();
    expect(await screen.findByRole('link', { name: 'Start Real teacher quiz' })).toHaveAttribute('href', '/student/quiz/quiz-1?activityId=activity-1');
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'All-time quiz and assessment score' })).not.toHaveAttribute('aria-valuenow');
  });

  it('keeps progress loading and retry independent from the dashboard', async () => {
    const refetch = vi.fn();
    useGet.mockImplementation((path: string) => path === '/student/progress' ? {
      data: undefined, isLoading: true, isError: false, refetch,
    } : { data: path === '/student/home' ? home : [], isLoading: false, isError: false, refetch });
    const { rerender } = renderHome();
    expect(await screen.findByText('Loading your progress…')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Learning' })).toBeInTheDocument();
    useGet.mockImplementation((path: string) => path === '/student/progress' ? {
      data: undefined, isLoading: false, isError: true, error: new Error('Progress unavailable'), refetch,
    } : { data: path === '/student/home' ? home : [], isLoading: false, isError: false, refetch });
    rerender(<MemoryRouter><StudentHome /></MemoryRouter>);
    expect(screen.getByText('Progress unavailable')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('does not update an unmounted dashboard when font loading finishes', async () => {
    let complete!: (fonts: FontFace[]) => void;
    load.mockReturnValue(new Promise<FontFace[]>((resolve) => { complete = resolve; }));
    const { unmount } = renderHome();
    unmount();
    await act(async () => complete([]));
    await waitFor(() => expect(screen.queryByText('Preparing your dashboard…')).not.toBeInTheDocument());
  });

  it('renders polished My Subjects cards with progress, counts, and navigation links', async () => {
    const homeWithSubjects: Home = {
      ...home,
      subjects: [
        { id: 'subj-1', code: 'ENG', name: 'English', icon: 'book-open', totalItems: 3, completedItems: 1, progressPercent: 33 },
        { id: 'subj-2', code: 'MATH', name: 'Mathematics', icon: 'calculator', totalItems: 3, completedItems: 2, progressPercent: 67 },
      ],
    };
    useGet.mockImplementation((path: string) => ({
      data: path === '/student/home' ? homeWithSubjects : path === '/student/progress' ? {
        overall: { averagePercent: null, quizAccuracyPercent: null },
      } : [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }));
    renderHome();

    expect(await screen.findByRole('heading', { name: 'My subjects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /All subjects/i })).toHaveAttribute('href', '/student/learn');

    const engLink = screen.getByRole('link', { name: /English/i });
    expect(engLink).toHaveAttribute('href', '/student/learn?subjectId=subj-1');
    expect(within(engLink).getByText('1 of 3 lessons')).toBeInTheDocument();
    expect(within(engLink).getByText('33%')).toBeInTheDocument();
    expect(within(engLink).getByRole('progressbar', { name: 'English progress' })).toHaveAttribute('aria-valuenow', '33');

    const mathLink = screen.getByRole('link', { name: /Mathematics/i });
    expect(mathLink).toHaveAttribute('href', '/student/learn?subjectId=subj-2');
    expect(within(mathLink).getByText('2 of 3 lessons')).toBeInTheDocument();
    expect(within(mathLink).getByText('67%')).toBeInTheDocument();
  });
});
