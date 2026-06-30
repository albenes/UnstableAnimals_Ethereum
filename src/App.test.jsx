import { render, screen } from '@testing-library/react'
import { WalletConnectionProvider } from './wallet/WalletConnectionProvider'
import App from './App'

test('renders Unstable Animals mint heading', () => {
  render(
    <WalletConnectionProvider>
      <App />
    </WalletConnectionProvider>
  )
  expect(screen.getByText(/Find your Unstable Animals!/i)).toBeInTheDocument()
})

test('renders timeline, team and footer sections', () => {
  render(
    <WalletConnectionProvider>
      <App />
    </WalletConnectionProvider>
  )
  expect(screen.getByText(/10% minted/i)).toBeInTheDocument()
  expect(screen.getByText(/^Team$/i)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Verified Smart Contract/i })).toBeInTheDocument()
})
