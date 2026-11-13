import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContextProvider, type AuthState } from '../../../auth/AuthContext';

const get = vi.fn();
const objectUrl = vi.fn();
vi.mock('../../../api/client', async (orig) => {
  const actual = await orig<typeof import('../../../api/client')>();
  return { ...actual, api: { ...actual.api, get: (...a: unknown[]) => get(...a), objectUrl: (...a: unknown[]) => objectUrl(...a) } };
});

import CertificatesPage from '../Certificates';

const auth: AuthState = {
  status: 'authenticated',
  user: { id: 'u1', name: 'Arjun', role: 'STUDENT', status: 'active', schools: [{ schoolId: 'school1', schoolName: 'Green Valley', schoolCode: 'GVS001', role: 'STUDENT' }] },
  activeSchoolId: 'school1',
  adminSchools: [{ schoolId: 'school1', schoolName: 'Green Valley', schoolCode: 'GVS001', role: 'STUDENT' }],
  login: vi.fn(),
  studentLogin: vi.fn(),
  logout: vi.fn(),
  setActiveSchoolId: vi.fn(),
  refreshUser: vi.fn(),
};

const certificate = { id: 'cert1', certificateNumber: 'MD-2026-000001', issuedAt: '2026-10-01T00:00:00.000Z' };

function wrap(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthContextProvider value={auth}>
        <MemoryRouter>{ui}</MemoryRouter>
      </AuthContextProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  get.mockReset();
  objectUrl.mockReset();
  objectUrl.mockResolvedValue('blob:mock');
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
});

describe('Certificate preview', () => {
  it('opens the issued certificate PDF in a dialog and revokes the object URL on close', async () => {
    get.mockImplementation((path: string) => {
      if (path.endsWith('/certifications/levels'))
        return Promise.resolve({
          currentLevel: 1,
          levels: [
            {
              id: 'lvl1',
              level: 1,
              title: 'Explorer',
              description: 'First steps',
              passPercent: 60,
              bestPercent: 80,
              attempts: 1,
              state: 'certified',
              certificate,
            },
          ],
        });
      if (path.endsWith('/students/u1/certificates'))
        return Promise.resolve([{ _id: 'cert1', level: 1, levelTitle: 'Explorer', certificateNumber: 'MD-2026-000001', issuedAt: '2026-10-01T00:00:00.000Z', percent: 80 }]);
      return Promise.resolve([]);
    });

    wrap(<CertificatesPage />);
    const user = userEvent.setup();
    const previews = await screen.findAllByRole('button', { name: /Preview/ });
    await user.click(previews[0]);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(objectUrl).toHaveBeenCalledWith('/certificates/cert1/pdf');
    const frame = await screen.findByTitle('Certificate MD-2026-000001');
    expect(frame).toHaveAttribute('src', 'blob:mock');

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock'));
  });
});
