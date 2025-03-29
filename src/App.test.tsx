import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Game component', () => {
  render(<App />);
  const linkElement = screen.getByText(/Pick 1 or more numbers that sum to the number of stars/i);
  expect(linkElement).toBeInTheDocument();
});
