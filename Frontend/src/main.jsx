import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';
import useAuthStore from './store/authStore.js';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const rootElement = document.getElementById('root');

if (rootElement) {
  // EDGE-05: Validate the stored session against the server before the first render.
  // This catches deactivated / deleted accounts and corrects stale roles (EDGE-06)
  // that local-only JWT decoding cannot detect.
  // We intentionally do NOT await here — the app renders immediately with the
  // persisted state (good UX) and ProtectedRoute re-checks once the promise resolves.
  useAuthStore.getState().validateSession();

  createRoot(rootElement).render(
    googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GoogleOAuthProvider>
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
  );
}
