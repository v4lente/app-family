import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DashboardPage from './page';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}));

describe('DashboardPage', () => {
  const mockUsers = [
    { id: 1, name: 'User1', email: 'user1@email.com', active: true },
    { id: 2, name: 'User2', email: 'user2@email.com', active: false },
  ];

  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url, opts) => {
      if (opts && opts.method === 'DELETE') {
        return Promise.resolve({ ok: true });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ users: mockUsers }) });
    });
    localStorage.setItem('token', 'fake-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders users and allows delete', async () => {
    render(<DashboardPage />);
    await waitFor(() => expect(screen.getByText('User1')).toBeInTheDocument());
    expect(screen.getByText('User2')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Excluir/i })[0]);
    // Confirmação do confirm
    window.confirm = jest.fn(() => true);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/users/1',
      expect.objectContaining({ method: 'DELETE' })
    ));
  });

  it('redirects to login if no token', async () => {
    localStorage.removeItem('token');
    render(<DashboardPage />);
    await waitFor(() => expect(global.fetch).not.toHaveBeenCalled());
  });
});
