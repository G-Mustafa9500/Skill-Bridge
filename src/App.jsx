import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';

// Lazy-loaded route pages for code splitting — each page ships as its own chunk.
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const CreateSkillListing = lazy(() => import('./pages/CreateSkillListing'));
const SkillDetail = lazy(() => import('./pages/SkillDetail'));
const Profile = lazy(() => import('./pages/Profile'));

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Spinner size={32} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute allowIncompleteProfile>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketplace"
                element={
                  <ProtectedRoute>
                    <Marketplace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketplace/new"
                element={
                  <ProtectedRoute>
                    <CreateSkillListing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketplace/:id/edit"
                element={
                  <ProtectedRoute>
                    <CreateSkillListing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketplace/:id"
                element={
                  <ProtectedRoute>
                    <SkillDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
