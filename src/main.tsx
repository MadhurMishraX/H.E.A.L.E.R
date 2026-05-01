import React from 'react';
import { createRoot } from 'react-dom/client';
import { seedDatabase } from './lib/seed';
import App from './App';
import './index.css';

seedDatabase().then(() => {
  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
