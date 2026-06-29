import React from 'react';
import { createRoot } from 'react-dom/client';
import Modal from 'react-modal';
import './index.css';
import App from './App';
import { WalletConnectionProvider } from './wallet/WalletConnectionProvider';
import reportWebVitals from './reportWebVitals';

Modal.setAppElement('#root');

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WalletConnectionProvider>
      <App />
    </WalletConnectionProvider>
  </React.StrictMode>
);

reportWebVitals();
