import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App';

beforeEach(() => {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve([]),
  } as unknown as Response);
});

afterEach(() => {
  vi.restoreAllMocks();
});

test('renders Chat App heading', async () => {
  await act(async () => {
    render(<App />);
  });
  expect(screen.getByRole('heading', { name: /chat app/i })).toBeDefined();
});

test('shows "No messages yet" after loading', async () => {
  await act(async () => {
    render(<App />);
  });
  await waitFor(() => {
    expect(screen.getByText('No messages yet')).toBeDefined();
  });
});

test('shows loading state initially', () => {
  vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}));
  render(<App />);
  expect(screen.getByText('Loading messages...')).toBeDefined();
});

test('shows error when fetch fails', async () => {
  vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
  await act(async () => {
    render(<App />);
  });
  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText('Network error')).toBeDefined();
  });
});
