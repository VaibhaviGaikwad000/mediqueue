import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useToast } from '../Toast';

const niceDate = value => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
export default function Patient() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const load = useCallback(async () => {
    try { const { data } = await api.get('/appointments/my'); setAppointments(data); }
    catch (error) { toast(errorMessage(error), 'error'); }
    finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);
  async function cancel(id) {
    try { await api.patch(`/appointments/${id}/cancel`); toast('Appointment cancelled'); load(); }
    catch (error) { toast(errorMessage(error), 'error'); }
  }
  const active = appointments.filter(item => ['waiting', 'in-progress'].includes(item.status));
  return <div className="page-wrap">
    <div className="page-heading"><div><span className="eyebrow">YOUR CARE, AT A GLANCE</span><h1>My visits</h1><p>All your appointments, together in one place.</p></div><Link className="button button-primary" to="/book">＋ Book a visit</Link></div>
    {loading ? <div className="loading-inline"><span className="spinner" /> Loading your appointments…</div> : appointments.length === 0 ? <div className="empty-state"><div className="empty-illustration">✳</div><h2>Your next visit starts here.</h2><p>No appointments yet. Find a doctor and book a time that works for you.</p><Link className="button button-primary" to="/book">Find a doctor</Link></div> :
      <div className="appointment-list">{appointments.map(item => <article className="appointment-card" key={item._id}>
        <div className="appointment-date"><span>{niceDate(item.date).split(',')[0]}</span><strong>{new Date(`${item.date}T12:00:00`).getDate()}</strong><small>{new Date(`${item.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short' })}</small></div>
        <div className="appointment-info"><div className="appointment-title"><h3>{item.doctorId?.userId?.name || 'Doctor'}</h3><span className={`status-pill status-${item.status}`}>{item.status}</span></div><p>{item.doctorId?.specialization} · {item.doctorId?.departmentId?.name}</p><div className="appointment-meta"><span>◷ {item.timeSlot}</span><span>Token <b>#{item.tokenNumber}</b></span></div></div>
        <div className="appointment-actions">
          {['waiting', 'in-progress'].includes(item.status) && active.some(visit => visit._id === item._id) && <Link className="button button-soft" to={`/track/${item.doctorId?._id}?date=${item.date}`}>Live track ↗</Link>}
          {item.status === 'waiting' && <button className="button button-quiet" onClick={() => cancel(item._id)}>Cancel</button>}
        </div>
      </article>)}</div>}
    {!loading && appointments.length > 0 && <p className="dashboard-footnote">{active.length ? 'Your live visits are ready to track.' : 'When you book again, your visit will appear here.'}</p>}
  </div>;
}
