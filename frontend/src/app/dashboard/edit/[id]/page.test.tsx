import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditUserPage from './page';
import '@testing-library/jest-dom';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() })
}));

describe('EditUserPage', () => {
  const mockUser = { id: 1, name: 'Test User', email: 'test@example.com', active: true };

  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn().mockImplementation((url, opts) => {
      if (opts && opts.method === 'PUT') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: mockUser }) });
    });
    localStorage.setItem('token', 'fake-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders user data and allows editing', async () => {
    render(<EditUserPage params={{ id: '1' }} />);
    await waitFor(() => expect(screen.getByDisplayValue('Test User')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Nome/i), { target: { value: 'Novo Nome' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'novo@email.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/users/1',
      expect.objectContaining({ method: 'PUT' })
    ));
  });

  it('redirects to login if no token', async () => {
    localStorage.removeItem('token');
    render(<EditUserPage params={{ id: '1' }} />);
    await waitFor(() => expect(global.fetch).not.toHaveBeenCalled());
  });
});
