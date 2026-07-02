import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

test('renders Chat App heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /chat app/i })).toBeDefined();
});
