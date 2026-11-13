import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const get = vi.fn();
vi.mock('../../../api/client', async (orig) => {
  const actual = await orig<typeof import('../../../api/client')>();
  return { ...actual, api: { ...actual.api, get: (...a: unknown[]) => get(...a) } };
});

import ProgrammesPage from '../Programmes';

const enrolled = {
  id: 'p1',
  name: 'AI Academy',
  description: 'Learn AI and future skills.',
  premium: true,
  locked: false,
  moduleCount: 3,
  enrolment: { progressPercent: 40, completed: false },
};
const notJoined = {
  id: 'p2',
  name: 'Chess Academy',
  description: 'Strategy and tactics.',
  premium: true,
  locked: false,
  moduleCount: 2,
};

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ premiumAcademies: [enrolled, notJoined], otherProgrammes: [] });
});

describe('Programmes filter', () => {
  it('shows every programme under "All" and only joined ones under "My programmes"', async () => {
    wrap(<ProgrammesPage />);
    expect(await screen.findByText('AI Academy')).toBeInTheDocument();
    expect(screen.getByText('Chess Academy')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('radio', { name: 'My programmes' }));

    expect(screen.getByText('AI Academy')).toBeInTheDocument();
    expect(screen.queryByText('Chess Academy')).not.toBeInTheDocument();
  });

  it('offers a way back to the catalogue when nothing is joined', async () => {
    get.mockResolvedValue({ premiumAcademies: [notJoined], otherProgrammes: [] });
    wrap(<ProgrammesPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('radio', { name: 'My programmes' }));

    expect(await screen.findByText('No programmes joined yet')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Browse all programmes' }));
    expect(screen.getByText('Chess Academy')).toBeInTheDocument();
  });
});
