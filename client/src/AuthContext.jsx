import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from './api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('mq_token')));
  useEffect(() => {
    if (!localStorage.getItem('mq_token')) return;
    api.get('/auth/me').then(({ data }) => setUser(data.user)).catch(() => {
      localStorage.removeItem('mq_token');
      setUser(null);
    }).finally(() => setLoading(false));
  }, []);
  const value = useMemo(() => ({
    user, loading,
    signIn(data) {
      localStorage.setItem('mq_token', data.token);
      setUser(data.user);
    },
    signOut() {
      localStorage.removeItem('mq_token');
      setUser(null);
    }
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
