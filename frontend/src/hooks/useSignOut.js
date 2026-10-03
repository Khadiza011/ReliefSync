import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Ends the session and lands on a clean sign-in page (no "return to" page for the next user). */
export function useSignOut() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return useCallback(() => {
    logout();
    navigate('/login', { replace: true, state: null });
  }, [logout, navigate]);
}

export default useSignOut;
