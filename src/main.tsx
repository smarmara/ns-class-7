import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import './styles.css';
import './styles-quiz.css';
import './styles-modules.css';
import './styles-exam.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element missing');

createRoot(container).render(
  <StrictMode>
    {/*
      HashRouter keeps deep links working when the PWA is served from a static
      host or a subdirectory, with no server rewrite rules required.
    */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
