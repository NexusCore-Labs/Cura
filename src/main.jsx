import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { initStorage, getProfile } from './utils/storage.js';
import { applyTextScaleToDom } from './hooks/useTextSize.js';
import App from './App.jsx';

initStorage();
const profile = getProfile();
applyTextScaleToDom(profile?.textScale);

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
