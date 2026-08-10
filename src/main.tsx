import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { LanguageProvider } from './context/LanguageContext.tsx';
import ErrorBoundary from './context/ErrorBoundary.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
