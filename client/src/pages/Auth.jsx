import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../Toast';

function AuthForm({ register = false }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const update = event => setForm({ ...form, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(`/auth/${register ? 'register' : 'login'}`, form);
      signIn(data);
      toast(register ? 'Your account is ready. Welcome!' : `Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate(data.user.role === 'admin' ? '/admin' : data.user.role === 'doctor' ? '/doctor' : '/patient');
    } catch (error) { toast(errorMessage(error), 'error'); }
    finally { setBusy(false); }
  }
  return <section className="auth-layout">
    <div className="auth-aside"><span className="eyebrow">YOUR CARE, IN GOOD HANDS</span><h1>{register ? 'A better visit starts here.' : 'Welcome back.'}</h1><p>Simple appointments and live queue updates, all in one place.</p><div className="auth-aside-decoration">✳</div></div>
    <div className="auth-card"><span className="eyebrow">{register ? 'CREATE YOUR ACCOUNT' : 'SIGN IN TO MEDIQUEUE'}</span><h2>{register ? 'Join MediQueue' : 'Good to see you'}</h2><p className="muted">{register ? 'Your next appointment is just a few clicks away.' : 'Pick up right where you left off.'}</p>
      <form onSubmit={submit} className="form-stack">
        {register && <label>Full name<input name="name" value={form.name} onChange={update} required minLength="2" maxLength="100" placeholder="e.g. Asha Patel" /></label>}
        <label>Email address<input name="email" type="email" value={form.email} onChange={update} required autoComplete="email" placeholder="you@example.com" /></label>
        {register && <label>Phone number <span className="optional">(optional)</span><input name="phone" value={form.phone} onChange={update} maxLength="30" placeholder="+91 98765 43210" /></label>}
        <label>Password<input name="password" type="password" value={form.password} onChange={update} required minLength={register ? 8 : 1} autoComplete={register ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /></label>
        <button className="button button-primary full-width" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create my account' : 'Sign in'} <span>↗</span></button>
      </form>
      {!register && <div className="demo-box"><strong>Demo accounts</strong><span>Patient: patient@mediqueue.com / Patient@123</span><span>Admin: admin@mediqueue.com / Admin@123</span><span>Doctor: doctor1@mediqueue.com / Doctor@123</span></div>}
      <p className="auth-switch">{register ? 'Already have an account?' : 'New to MediQueue?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
    </div>
  </section>;
}
export function Login() { return <AuthForm />; }
export function Register() { return <AuthForm register />; }
