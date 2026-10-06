import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useQueueSocket } from '../hooks';
import { useToast } from '../Toast';

export default function Track() {
  const { doctorId } = useParams();
  const [search] = useSearchParams();
  const date = search.get('date') || '';
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const load = useCallback(async () => {
    try { const { data } = await api.get(`/queue/${doctorId}`, { params: date ? { date } : {} }); setQueue(data); }
    catch (error) { toast(errorMessage(error), 'error'); }
    finally { setLoading(false); }
  }, [doctorId, date, toast]);
  useEffect(() => { load(); }, [load]);
  const onQueueUpdate = useCallback(data => {
    if (!date || data.date === date) setQueue(current => ({ ...current, ...data }));
  }, [date]);
  useQueueSocket(doctorId, onQueueUpdate);
  const mine = queue?.myAppointment;
  const ahead = mine?.patientsAhead || 0;
  return <div className="page-wrap track-wrap">
    <div className="page-heading"><div><span className="eyebrow"><i className="live-dot" /> LIVE QUEUE</span><h1>Your visit, in real time.</h1><p>We’ll keep this page up to date while you wait.</p></div><Link to="/patient" className="text-link">← My visits</Link></div>
    {loading ? <div className="loading-inline"><span className="spinner" /> Connecting to your queue…</div> : !queue ? <div className="empty-state"><h2>Queue unavailable</h2><p>We couldn’t load the queue right now.</p><button className="button button-soft" onClick={load}>Try again</button></div> :
      <div className="track-content">
        {!mine && <div className="inline-alert">There isn’t an active appointment for you in this queue on {queue.date}. You can still see the current serving token.</div>}
        <div className="track-card">
          <div className="track-card-head"><span className="live-badge"><i /> LIVE UPDATES ON</span><span>{queue.date}</span></div>
          <div className="token-display"><span>YOUR TOKEN</span><strong>{mine ? `#${String(mine.tokenNumber).padStart(2, '0')}` : '—'}</strong><b className={`status-pill status-${mine?.status || 'waiting'}`}>{mine ? mine.status : 'No active visit'}</b></div>
          <div className="queue-progress"><div><span style={{ width: `${mine ? Math.min(100, (mine.tokenNumber - ahead) / Math.max(mine.tokenNumber, 1) * 100) : 0}%` }} /></div><small>Queue moves as each visit is completed</small></div>
          <div className="track-stats"><div><span>NOW SERVING</span><strong>{queue.nowServing ? `#${String(queue.nowServing.tokenNumber).padStart(2, '0')}` : '—'}</strong></div><div><span>PATIENTS AHEAD</span><strong>{mine ? ahead : '—'}</strong></div><div><span>ESTIMATED WAIT</span><strong>{mine ? `${ahead * (queue.avgConsultTime || 10)} min` : '—'}</strong></div></div>
          <div className="track-reassurance"><span>✳</span><p>{mine?.status === 'in-progress' ? 'It’s your turn now. Please head to the doctor.' : mine ? ahead === 0 ? 'You’re next! Please be ready.' : 'We’ll let you know when your turn is getting close.' : 'Book an appointment to receive your personal token.'}</p></div>
        </div>
        <div className="track-side"><div className="mini-queue-card"><span className="eyebrow">TODAY’S QUEUE</span><h3>{queue.waiting?.length || 0} waiting</h3><p>Average consultation · {queue.avgConsultTime || 10} minutes</p><div className="queue-tokens">{queue.waiting?.slice(0, 8).map(item => <span className={item.tokenNumber === mine?.tokenNumber ? 'my-queue-token' : ''} key={item.id}>#{item.tokenNumber}</span>)}</div></div><div className="help-note">Queue estimates are approximate and may change during your visit.</div></div>
      </div>}
  </div>;
}
