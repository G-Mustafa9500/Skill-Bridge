import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ children, allowIncompleteProfile = false }) {
  const { isAuthenticated, loading, needsOnboarding } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <Spinner size={32} />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (needsOnboarding && !allowIncompleteProfile) return <Navigate to="/onboarding" replace />;
  return children;
}
