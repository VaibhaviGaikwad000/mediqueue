import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import Patient from './pages/Patient';
import Book from './pages/Book';
import Track from './pages/Track';
import Doctor from './pages/Doctor';
import Admin from './pages/Admin';

function Loading() { return <div className="loading-screen"><span className="spinner" /> Loading MediQueue…</div>; }
function Guard({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/patient'} replace />;
  return children;
}
function Layout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMenuOpen(false), [location.pathname]);
  const logout = () => {
    signOut();
    toast('You have signed out');
    navigate('/');
  };
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand"><span className="brand-mark">+</span><span>Medi<span>Queue</span></span></Link>
      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">☰</button>
      <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
        <Link to="/">Home</Link>
        {user?.role === 'patient' && <><Link to="/patient">My visits</Link><Link to="/book">Book a visit</Link></>}
        {user?.role === 'doctor' && <Link to="/doctor">Doctor panel</Link>}
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        {user ? <button className="nav-logout" onClick={logout}>Sign out</button> : <Link className="nav-login" to="/login">Sign in</Link>}
      </nav>
    </header>
    <main>{children}</main>
    <footer className="footer"><span>© {new Date().getFullYear()} MediQueue</span><span>Thoughtful care. Less waiting.</span></footer>
  </div>;
}

export default function App() {
  const { user } = useAuth();
  return <Layout><Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
    <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
    <Route path="/patient" element={<Guard roles={['patient']}><Patient /></Guard>} />
    <Route path="/book" element={<Guard roles={['patient']}><Book /></Guard>} />
    <Route path="/track/:doctorId" element={<Guard roles={['patient']}><Track /></Guard>} />
    <Route path="/doctor" element={<Guard roles={['doctor']}><Doctor /></Guard>} />
    <Route path="/admin" element={<Guard roles={['admin']}><Admin /></Guard>} />
    <Route path="*" element={<section className="empty-state"><span className="eyebrow">404 · Not found</span><h1>We can't find that page.</h1><Link className="button button-primary" to="/">Back to home</Link></section>} />
  </Routes></Layout>;
}
