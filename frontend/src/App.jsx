import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes';
import { Toaster } from './components/ui/Toaster';
import { useAuth } from './context/AuthContext';
import { useToast } from './context/ToastContext';

function App() {
  const { sessionExpired, clearSessionExpired } = useAuth();
  const toast = useToast();

  // Tell the user once when their token expires mid-session
  useEffect(() => {
    if (sessionExpired) {
      toast.warning('Session expired', 'Please sign in again to continue.');
      clearSessionExpired();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionExpired]);

  return (
    <>
      <div className="app-ambient" aria-hidden="true" />
      <AppRoutes />
      <Toaster />
    </>
  );
}

export default App;
