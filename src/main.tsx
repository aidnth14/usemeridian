import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AppLoader from './components/AppLoader';
import CertificateViewPage from './pages/CertificateViewPage';
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
        </Routes>
      </AppLoader>
    </BrowserRouter>
  </React.StrictMode>
);
