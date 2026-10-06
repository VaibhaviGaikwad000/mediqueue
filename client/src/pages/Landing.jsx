import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const features = [
  { icon: '◷', title: 'Know before you go', copy: 'See your place in line and a live estimate, so your day stays yours.' },
  { icon: '✳', title: 'Appointments made easy', copy: 'Choose the right department, doctor and time in just a few steps.' },
  { icon: '♡', title: 'Care that feels connected', copy: 'Get helpful turn reminders and clear updates throughout your visit.' }
];
export default function Landing() {
  const { user } = useAuth();
  const home = user?.role === 'admin' ? '/admin' : user?.role === 'doctor' ? '/doctor' : '/patient';
  return <div className="landing">
    <section className="hero">
      <div className="hero-copy">
        <span className="eyebrow"><i /> A calmer way to visit the doctor</span>
        <h1>Good care.<br /><em>Less waiting.</em></h1>
        <p>Book your appointment and follow the queue in real time. Spend less time wondering, and more time feeling better.</p>
        <div className="hero-actions"><Link className="button button-primary" to={user ? home : '/register'}>{user ? 'Go to your dashboard' : 'Get started'} <span>↗</span></Link><Link className="text-link" to={user ? home : '/login'}>{user ? 'Open dashboard' : 'I already have an account'}</Link></div>
        <div className="hero-note"><span className="avatar-stack"><i>✚</i><i>♡</i><i>✳</i></span><span>Thoughtful care, from check-in to check-up.</span></div>
      </div>
      <div className="hero-art">
        <div className="art-sun" />
        <div className="art-card">
          <div className="art-card-top"><span className="live-dot" /> LIVE QUEUE <span>Today</span></div>
          <div className="art-token"><small>YOUR TOKEN</small><strong>#08</strong><span>You're almost there</span></div>
          <div className="art-progress"><span /></div>
          <div className="art-metrics"><div><small>NOW SERVING</small><b>#05</b></div><div><small>EST. WAIT</small><b>~30 min</b></div></div>
          <div className="art-people"><span className="mini-avatar">A</span><span className="mini-avatar peach">R</span><span className="mini-avatar blue">S</span><span>3 people ahead of you</span></div>
        </div>
        <div className="art-sticker">Care, on<br />your time <span>✳</span></div>
        <div className="art-cross">✚</div>
      </div>
    </section>
    <section className="features-section">
      <div className="section-heading"><span className="eyebrow">A little more peace of mind</span><h2>Healthcare, with a better rhythm.</h2><p>Every detail is designed to make your next visit feel simpler.</p></div>
      <div className="feature-grid">{features.map((feature, index) => <article className="feature-card" key={feature.title}><span className={`feature-icon feature-${index}`}>{feature.icon}</span><h3>{feature.title}</h3><p>{feature.copy}</p></article>)}</div>
    </section>
  </div>;
}
