import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App';
import './index.css';

Sentry.init({
  dsn: "https://08bccdf81eda47353f0326f9abd7e93b@o1063428.ingest.us.sentry.io/4509063145652224",
  // Enable performance monitoring
  tracesSampleRate: 1.0,
  // Enable session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
