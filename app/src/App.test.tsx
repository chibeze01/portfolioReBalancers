import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders header', async () => {
  render(<App />);
  await waitFor(() => {
    const headerElement = screen.getByText(/AI-Powered Portfolio Balancer/i);
    expect(headerElement).toBeInTheDocument();
  });
});
