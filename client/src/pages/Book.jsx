import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useToast } from '../Toast';

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export default function Book() {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState(localDate());
  const [timeSlot, setTimeSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const timeSlots = useMemo(() => Array.from({ length: 16 }, (_, index) => {
    const minutes = 9 * 60 + index * 30;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }), []);
  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data)).catch(error => toast(errorMessage(error), 'error')).finally(() => setLoading(false));
  }, [toast]);
  useEffect(() => {
    if (!departmentId) { setDoctors([]); setDoctorId(''); return; }
    api.get('/doctors', { params: { departmentId } }).then(({ data }) => {
      setDoctors(data);
      setDoctorId(current => data.some(doc => doc._id === current) ? current : '');
    }).catch(error => toast(errorMessage(error), 'error'));
  }, [departmentId, toast]);
  async function submit(event) {
    event.preventDefault();
    if (!doctorId || !date || !timeSlot) { toast('Choose a department, doctor, date and time.', 'error'); return; }
    setBusy(true);
    try {
      const { data } = await api.post('/appointments', { doctorId, date, timeSlot });
      toast(`You're booked! Your token is #${data.tokenNumber}.`);
      navigate(`/track/${doctorId}?date=${date}`);
    } catch (error) { toast(errorMessage(error), 'error'); }
    finally { setBusy(false); }
  }
  const selectedDoctor = doctors.find(doc => doc._id === doctorId);
  return <div className="page-wrap booking-wrap">
    <div className="page-heading"><div><span className="eyebrow">A FEW SIMPLE STEPS</span><h1>Book a visit</h1><p>Choose a doctor and a time that suits you.</p></div><span className="step-count">01 <i>/</i> 04</span></div>
    {loading ? <div className="loading-inline"><span className="spinner" /> Loading departments…</div> : <div className="booking-layout">
      <form className="booking-card form-stack" onSubmit={submit}>
        <div className="form-section-title"><span>01</span><div><h2>Find your specialist</h2><p>Start with the care you need.</p></div></div>
        <label>Department<select required value={departmentId} onChange={event => setDepartmentId(event.target.value)}><option value="">Choose a department</option>{departments.map(dept => <option key={dept._id} value={dept._id}>{dept.name}</option>)}</select></label>
        <label>Doctor<select required value={doctorId} onChange={event => setDoctorId(event.target.value)} disabled={!departmentId}><option value="">{departmentId ? doctors.length ? 'Choose a doctor' : 'No doctors available here' : 'Choose a department first'}</option>{doctors.map(doc => <option key={doc._id} value={doc._id}>{doc.userId?.name} · {doc.specialization}</option>)}</select></label>
        {selectedDoctor && <div className="selected-doctor"><span className="doctor-avatar">{selectedDoctor.userId?.name?.split(' ').map(word => word[0]).slice(-2).join('')}</span><div><b>{selectedDoctor.userId?.name}</b><span>{selectedDoctor.specialization} · {selectedDoctor.avgConsultTime} min per visit</span></div><span className="available-dot">Accepting visits</span></div>}
        <div className="form-section-title section-spaced"><span>02</span><div><h2>Pick a day & time</h2><p>Available Monday through Sunday, 9 am–5 pm.</p></div></div>
        <label>Appointment date<input type="date" value={date} min={localDate()} onChange={event => setDate(event.target.value)} required /></label>
        <label>Time slot<select required value={timeSlot} onChange={event => setTimeSlot(event.target.value)}><option value="">Choose a 30-minute slot</option>{timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}</select></label>
        <button className="button button-primary full-width" disabled={busy}>{busy ? 'Booking your visit…' : 'Get my token'} <span>↗</span></button>
        <p className="form-legal">You can cancel while your appointment is waiting.</p>
      </form>
      <aside className="booking-aside"><span className="eyebrow">YOUR VISIT, MADE SIMPLE</span><h2>More care.<br /><em>Less clock-watching.</em></h2><p>Once you’re booked, your personal token and live queue updates will be ready right here.</p><div className="booking-aside-card"><span>✳</span><div><b>A little heads-up</b><p>We’ll let you know when your turn is getting close.</p></div></div></aside>
    </div>}
  </div>;
}
