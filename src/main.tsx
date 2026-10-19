import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AppLoader from './components/AppLoader';
import CertificateViewPage from './pages/CertificateViewPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookieConsent from './components/CookieConsent';
import { RegistryFormProvider } from './context/RegistryFormContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppLoader>
        <Routes>
          <Route
            path="/"
            element={
              <RegistryFormProvider>
                <App />
              </RegistryFormProvider>
            }
          />
          <Route path="/cert/:idnum" element={<CertificateViewPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
        </Routes>
        <CookieConsent />
      </AppLoader>
    </BrowserRouter>
  </React.StrictMode>
);
