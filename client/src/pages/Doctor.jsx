import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../api';
import { useQueueSocket } from '../hooks';
import { useToast } from '../Toast';

export default function Doctor() {
  const [doctor, setDoctor] = useState(null);
  const [queue, setQueue] = useState(null);
  const [avg, setAvg] = useState(10);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const load = useCallback(async () => {
    try {
      const { data: profile } = await api.get('/doctors/me');
      const { data: todayQueue } = await api.get(`/queue/${profile._id}`);
      setDoctor(profile); setQueue(todayQueue); setAvg(profile.avgConsultTime);
    } catch (error) {
      toast(errorMessage(error), 'error');
    } finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);
  const onQueueUpdate = useCallback(data => setQueue(current => ({ ...current, ...data })), []);
  useQueueSocket(doctor?._id, onQueueUpdate);
  async function act(action) {
    if (!doctor) return;
    try {
      const { data } = await api.patch(`/queue/${doctor._id}/${action}`, {});
      setQueue(data);
      toast(action === 'next' ? (data.nowServing ? `Now calling token #${data.nowServing.tokenNumber}` : 'No more patients waiting') : action === 'complete' ? 'Visit marked completed' : 'Patient marked as no-show');
    } catch (error) { toast(errorMessage(error), 'error'); }
  }
  async function saveSettings(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/doctors/me', { avgConsultTime: Number(avg), isActive: doctor.isActive });
      setDoctor(data);
      toast('Doctor settings updated');
    } catch (error) { toast(errorMessage(error), 'error'); }
    finally { setSaving(false); }
  }
  if (loading) return <div className="loading-screen"><span className="spinner" /> Loading doctor panel…</div>;
  if (!doctor) return <div className="page-wrap"><div className="empty-state"><h2>Doctor profile not found</h2><p>Please ask an administrator to set up your doctor profile.</p></div></div>;
  return <div className="page-wrap doctor-page">
    <div className="page-heading"><div><span className="eyebrow">DOCTOR WORKSPACE · {doctor.departmentId?.name}</span><h1>Good day, {doctor.userId?.name?.split(' ').slice(-1)[0]}.</h1><p>Here’s how your queue is moving today.</p></div><span className={doctor.isActive ? 'availability-tag' : 'availability-tag unavailable'}><i /> {doctor.isActive ? 'Accepting appointments' : 'Not accepting appointments'}</span></div>
    <div className="doctor-dashboard">
      <section className="doctor-main">
        <div className="serving-card"><div><span className="eyebrow">NOW SERVING</span><strong>{queue?.nowServing ? `#${String(queue.nowServing.tokenNumber).padStart(2, '0')}` : '—'}</strong><span>{queue?.nowServing?.patient?.name || (queue?.nowServing ? 'Patient in consultation' : 'No patient in consultation')}</span></div><div className="serving-symbol">✳</div></div>
        <div className="doctor-action-row"><button className="button button-primary" onClick={() => act('next')}>↗ Call next patient</button><button className="button button-soft" onClick={() => act('complete')} disabled={!queue?.nowServing}>✓ Mark completed</button><button className="button button-quiet" onClick={() => act('noshow')} disabled={!queue?.nowServing}>No-show</button></div>
        <section className="panel-card"><div className="panel-card-heading"><div><span className="eyebrow">UP NEXT</span><h2>Waiting room <span className="count-badge">{queue?.waiting?.length || 0}</span></h2></div><span className="live-badge"><i /> LIVE</span></div>
          {queue?.waiting?.length ? <div className="table-scroll"><table><thead><tr><th>Token</th><th>Patient</th><th>Scheduled</th><th>Est. wait</th></tr></thead><tbody>{queue.waiting.map(item => <tr key={item.id}><td><span className="table-token">#{String(item.tokenNumber).padStart(2, '0')}</span></td><td>{item.patient?.name || 'Patient'}</td><td>{item.timeSlot}</td><td>~{(item.patientsAhead || 0) * doctor.avgConsultTime} min</td></tr>)}</tbody></table></div> : <div className="table-empty">The waiting room is clear for now. Take a breath. ✳</div>}
        </section>
      </section>
      <aside className="doctor-sidebar">
        <form className="panel-card settings-card form-stack" onSubmit={saveSettings}><span className="eyebrow">YOUR PRACTICE</span><h2>Queue settings</h2><label>Average consultation time <div className="input-suffix"><input type="number" min="1" max="120" value={avg} onChange={event => setAvg(event.target.value)} required /><span>min</span></div></label><div className="settings-toggle"><div><b>Accepting appointments</b><span>Patients can book with you</span></div><button type="button" role="switch" aria-checked={doctor.isActive} className={`toggle ${doctor.isActive ? 'toggle-on' : ''}`} onClick={() => setDoctor({ ...doctor, isActive: !doctor.isActive })}><i /></button></div><button className="button button-soft full-width" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button></form>
        <div className="tip-card"><span>✳</span><h3>A smoother queue</h3><p>Patients with three or fewer people ahead are automatically sent a turn reminder.</p></div>
      </aside>
    </div>
  </div>;
}
