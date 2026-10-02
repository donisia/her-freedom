import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { FlashProvider } from './context/FlashContext';
import { NostrProvider } from './context/NostrContext';
import { LightningProvider } from './context/LightningContext';
import './index.css';

// Flash wraps the others because Nostr and Lightning both emit notifications.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FlashProvider>
        <NostrProvider>
          <LightningProvider>
            <App />
          </LightningProvider>
        </NostrProvider>
      </FlashProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
