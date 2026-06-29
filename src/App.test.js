import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Unstable Animals mint heading', () => {
  render(<App />);
  expect(screen.getByText(/Find your Unstable Animals!/i)).toBeInTheDocument();
});
