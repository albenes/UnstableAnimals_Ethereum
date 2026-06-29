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
