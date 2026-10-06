import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { errorMessage } from '../api';
import { useToast } from '../Toast';

const TABS = ['Overview', 'Doctors', 'Departments', 'Appointments'];
const emptyDoctor = { name: '', email: '', password: 'Doctor@123', departmentId: '', specialization: '' };
export default function Admin() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState({ status: '', date: '', doctorId: '' });
  const [doctorForm, setDoctorForm] = useState(emptyDoctor);
  const [departmentForm, setDepartmentForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: overview }, { data: doctorRows }, { data: deptRows }, { data: visits }] = await Promise.all([
        api.get('/admin/stats'), api.get('/doctors', { params: { all: true } }), api.get('/departments'), api.get('/admin/appointments')
      ]);
      setStats(overview); setDoctors(doctorRows); setDepartments(deptRows); setAppointments(visits);
    } catch (error) { toast(errorMessage(error), 'error'); }
    finally { setLoading(false); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);
  const filteredAppointments = useMemo(() => appointments.filter(item =>
    (!filters.status || item.status === filters.status) &&
    (!filters.date || item.date === filters.date) &&
    (!filters.doctorId || item.doctorId?._id === filters.doctorId)
  ), [appointments, filters]);
  async function submitDoctor(event) {
    event.preventDefault(); setBusy(true);
    try {
      await api.post('/doctors', doctorForm);
      toast('Doctor account created'); setDoctorForm(emptyDoctor); await load();
    } catch (error) { toast(errorMessage(error), 'error'); }
    finally { setBusy(false); }
  }
  async function toggleDoctor(doc) {
    try { await api.put(`/doctors/${doc._id}`, { isActive: !doc.isActive }); toast(doc.isActive ? 'Appointments paused for doctor' : 'Doctor is now accepting appointments'); await load(); }
    catch (error) { toast(errorMessage(error), 'error'); }
  }
  async function deleteDoctor(doc) {
    if (!window.confirm(`Delete ${doc.userId?.name || 'this doctor'}? This is only allowed when they have no active appointments.`)) return;
    try { await api.delete(`/doctors/${doc._id}`); toast('Doctor deleted'); await load(); }
    catch (error) { toast(errorMessage(error), 'error'); }
  }
  async function submitDepartment(event) {
    event.preventDefault(); setBusy(true);
    try { await api.post('/departments', departmentForm); toast('Department added'); setDepartmentForm({ name: '', description: '' }); await load(); }
    catch (error) { toast(errorMessage(error), 'error'); }
    finally { setBusy(false); }
  }
  async function deleteDepartment(department) {
    if (!window.confirm(`Delete ${department.name}? It must not have any doctors.`)) return;
    try { await api.delete(`/departments/${department._id}`); toast('Department deleted'); await load(); }
    catch (error) { toast(errorMessage(error), 'error'); }
  }
  const statusCounts = stats?.statusCounts || {};
  const statusTotal = Object.values(statusCounts).reduce((sum, count) => sum + count, 0) || 1;
  return <div className="page-wrap admin-page">
    <div className="page-heading"><div><span className="eyebrow">MEDIQUEUE CONTROL ROOM</span><h1>Admin dashboard</h1><p>One clear view of care across your hospital.</p></div><button className="button button-soft" onClick={load}>↻ Refresh</button></div>
    <div className="admin-tabs" role="tablist">{TABS.map(item => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}</div>
    {loading && !stats ? <div className="loading-inline"><span className="spinner" /> Gathering today’s picture…</div> : <>
      {tab === 'Overview' && stats && <section className="admin-overview">
        <div className="stat-grid">
          <div className="stat-card"><span>APPOINTMENTS TODAY</span><strong>{stats.todayTotal}</strong><small>All appointment statuses</small><i>✳</i></div>
          <div className="stat-card"><span>AVERAGE WAIT</span><strong>{stats.averageWaitMinutes}<small> min</small></strong><small>From booking to being called</small><i>◷</i></div>
          <div className="stat-card"><span>NO-SHOW RATE</span><strong>{stats.noShowPercent}<small>%</small></strong><small>Of today’s appointments</small><i>↗</i></div>
          <div className="stat-card"><span>ACTIVE DOCTORS</span><strong>{doctors.filter(doc => doc.isActive).length}</strong><small>Currently taking appointments</small><i>♡</i></div>
        </div>
        <div className="overview-grid">
          <section className="panel-card chart-card"><div className="panel-card-heading"><div><span className="eyebrow">APPOINTMENT FLOW</span><h2>Last 7 days</h2></div><span className="chart-legend"><i /> Visits</span></div><div className="bar-chart">{stats.lastSevenDays.map(day => {
            const max = Math.max(...stats.lastSevenDays.map(item => item.total), 1);
            return <div className="bar-column" key={day.date}><span className="bar-value">{day.total || ''}</span><div className="bar-track"><i style={{ height: `${Math.max(day.total ? day.total / max * 100 : 3, 3)}%` }} /></div><small>{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</small></div>;
          })}</div></section>
          <section className="panel-card status-card"><span className="eyebrow">TODAY AT A GLANCE</span><h2>Visit statuses</h2><div className="status-bars">{Object.entries(statusCounts).map(([status, count]) => <div key={status}><div><span>{status.replace('-', ' ')}</span><b>{count}</b></div><i><span className={`bar-${status}`} style={{ width: `${count / statusTotal * 100}%` }} /></i></div>)}</div></section>
        </div>
      </section>}
      {tab === 'Doctors' && <div className="admin-management">
        <section className="panel-card management-table"><div className="panel-card-heading"><div><span className="eyebrow">YOUR CARE TEAM</span><h2>Doctors <span className="count-badge">{doctors.length}</span></h2></div></div><div className="table-scroll"><table><thead><tr><th>Doctor</th><th>Department</th><th>Consult</th><th>Status</th><th>Actions</th></tr></thead><tbody>{doctors.map(doc => <tr key={doc._id}><td><b>{doc.userId?.name}</b><small>{doc.userId?.email}</small></td><td>{doc.departmentId?.name}</td><td>{doc.avgConsultTime} min</td><td><span className={`status-pill ${doc.isActive ? 'status-completed' : 'status-cancelled'}`}>{doc.isActive ? 'Active' : 'Paused'}</span></td><td className="row-actions"><button onClick={() => toggleDoctor(doc)}>{doc.isActive ? 'Pause' : 'Activate'}</button><button className="danger-link" onClick={() => deleteDoctor(doc)}>Delete</button></td></tr>)}</tbody></table>{doctors.length === 0 && <div className="table-empty">No doctors have been added.</div>}</div></section>
        <form className="panel-card admin-form form-stack" onSubmit={submitDoctor}><span className="eyebrow">GROW YOUR CARE TEAM</span><h2>Add a doctor</h2><label>Full name<input required minLength="2" value={doctorForm.name} onChange={e => setDoctorForm({ ...doctorForm, name: e.target.value })} /></label><label>Email<input type="email" required value={doctorForm.email} onChange={e => setDoctorForm({ ...doctorForm, email: e.target.value })} /></label><label>Temporary password<input type="password" required minLength="8" value={doctorForm.password} onChange={e => setDoctorForm({ ...doctorForm, password: e.target.value })} /></label><label>Department<select required value={doctorForm.departmentId} onChange={e => setDoctorForm({ ...doctorForm, departmentId: e.target.value })}><option value="">Choose department</option>{departments.map(dept => <option key={dept._id} value={dept._id}>{dept.name}</option>)}</select></label><label>Specialization<input required value={doctorForm.specialization} onChange={e => setDoctorForm({ ...doctorForm, specialization: e.target.value })} /></label><button className="button button-primary full-width" disabled={busy}>Create doctor account ↗</button></form>
      </div>}
      {tab === 'Departments' && <div className="department-admin"><section className="department-admin-list">{departments.map(dept => <article className="department-admin-card" key={dept._id}><div><span className="feature-icon feature-1">✳</span><h3>{dept.name}</h3><p>{dept.description || 'Department of MediQueue'}</p></div><button className="danger-link" onClick={() => deleteDepartment(dept)}>Delete</button></article>)}</section><form className="panel-card admin-form form-stack" onSubmit={submitDepartment}><span className="eyebrow">EXPAND YOUR SERVICES</span><h2>Add a department</h2><label>Department name<input required minLength="2" maxLength="80" value={departmentForm.name} onChange={e => setDepartmentForm({ ...departmentForm, name: e.target.value })} /></label><label>Description<textarea rows="3" value={departmentForm.description} onChange={e => setDepartmentForm({ ...departmentForm, description: e.target.value })} /></label><button className="button button-primary full-width" disabled={busy}>Add department ↗</button></form></div>}
      {tab === 'Appointments' && <section className="panel-card appointment-admin"><div className="panel-card-heading"><div><span className="eyebrow">HOSPITAL-WIDE VIEW</span><h2>Appointments</h2></div></div><div className="filters-row"><label>Status<select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{['waiting', 'in-progress', 'completed', 'cancelled', 'no-show'].map(status => <option key={status} value={status}>{status}</option>)}</select></label><label>Date<input type="date" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} /></label><label>Doctor<select value={filters.doctorId} onChange={e => setFilters({ ...filters, doctorId: e.target.value })}><option value="">All doctors</option>{doctors.map(doc => <option key={doc._id} value={doc._id}>{doc.userId?.name}</option>)}</select></label><button className="button button-quiet" onClick={() => setFilters({ status: '', date: '', doctorId: '' })}>Clear</button></div><div className="table-scroll"><table><thead><tr><th>Date & time</th><th>Patient</th><th>Doctor</th><th>Token</th><th>Status</th></tr></thead><tbody>{filteredAppointments.map(item => <tr key={item._id}><td>{item.date}<small>{item.timeSlot}</small></td><td>{item.patientId?.name}<small>{item.patientId?.email}</small></td><td>{item.doctorId?.userId?.name}<small>{item.doctorId?.departmentId?.name}</small></td><td><span className="table-token">#{item.tokenNumber}</span></td><td><span className={`status-pill status-${item.status}`}>{item.status}</span></td></tr>)}</tbody></table>{filteredAppointments.length === 0 && <div className="table-empty">No appointments match those filters.</div>}</div></section>}
    </>}
  </div>;
}
