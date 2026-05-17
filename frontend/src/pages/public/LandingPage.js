import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../../landing.css';
import {
  Sprout, Truck, BarChart3, ShieldCheck, ArrowRight, CheckCircle,
  Users, Package, Building2, Globe, Leaf, Zap, Cloud, MapPin,
  Wifi, Radio, Thermometer, Droplets, Sun, Wind, Star, ChevronRight,
  Activity, Eye, TrendingUp, Award, Landmark, BadgeCheck, Satellite,
  MonitorSmartphone, ScanLine, ShoppingBag
} from 'lucide-react';
import AgriGovLogo from '../../components/common/AgriGovLogo';
import api from '../../api/axiosConfig';

/* ─── Intersection Observer Hook ─── */
function useInView(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } }, { threshold: 0.15, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ─── Animated Counter ─── */
function AnimCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useInView();
  useEffect(() => {
    if (!visible) return;
    const num = parseInt(target.replace(/\D/g, ''));
    let start = 0;
    const inc = num / 80;
    const timer = setInterval(() => {
      start += inc;
      if (start >= num) { setCount(num); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Section Wrapper ─── */
function Section({ children, className = '', dark, green }) {
  const [ref, visible] = useInView();
  const bg = dark ? 'ag-section-dark' : green ? 'ag-section-green' : 'ag-section-light';
  return (
    <section ref={ref} className={`ag-section ${bg} ${className} ag-animate ${visible ? 'ag-visible' : ''}`}>
      <div className="ag-container">{children}</div>
    </section>
  );
}

/* ─── Data ─── */
const FEATURES = [
  { icon: <BarChart3 size={26} />, title: 'Smart Analytics', desc: 'Real-time crop monitoring, yield predictions, and market intelligence powered by advanced data analysis.', color: '#ECFDF5', ic: '#059669' },
  { icon: <Sprout size={26} />, title: 'Direct Farm-to-Market', desc: 'Eliminate middlemen with direct producer-to-buyer connections. Fair prices, verified quality.', color: '#EFF6FF', ic: '#2563EB' },
  { icon: <Truck size={26} />, title: 'Logistics Network', desc: 'GPS-tracked deliveries across all 58 wilayas with optimized routing and real-time status updates.', color: '#FFF7ED', ic: '#EA580C' },
  { icon: <ShieldCheck size={26} />, title: 'Government Certified', desc: 'Ministry-supervised platform with validated users, official pricing, and institutional oversight.', color: '#F5F3FF', ic: '#7C3AED' },
];

const STATS = [
  { val: '2800', suf: '+', label: 'Active Producers', icon: <Sprout size={24} />, color: 'rgba(16,185,129,.15)', ic: '#10B981' },
  { val: '14000', suf: '+', label: 'Verified Buyers', icon: <Users size={24} />, color: 'rgba(37,99,235,.15)', ic: '#2563EB' },
  { val: '58', suf: '', label: 'Wilayas Covered', icon: <MapPin size={24} />, color: 'rgba(234,88,12,.15)', ic: '#EA580C' },
  { val: '42000', suf: '+', label: 'Products Listed', icon: <Package size={24} />, color: 'rgba(124,58,237,.15)', ic: '#7C3AED' },
];

const WORKFLOWS = [
  {
    num: '01', icon: <Sprout size={28} />, title: 'Farmer', color: 'rgba(16,185,129,.2)', ic: '#10B981',
    desc: 'Publish products, manage harvests, set prices within official ranges, and request logistics.',
    items: ['Register & verify identity', 'List farm products', 'Accept buyer orders', 'Track deliveries']
  },
  {
    num: '02', icon: <ShoppingBag size={28} />, title: 'Buyer', color: 'rgba(37,99,235,.2)', ic: '#2563EB',
    desc: 'Browse certified farms, compare official prices, place orders with full delivery tracking.',
    items: ['Explore marketplace', 'Compare with ref. prices', 'Checkout with tracking', 'Confirm receipt']
  },
  {
    num: '03', icon: <Truck size={28} />, title: 'Transporter', color: 'rgba(234,88,12,.2)', ic: '#EA580C',
    desc: 'Accept delivery missions, manage fleet and zones, earn from the integrated logistics network.',
    items: ['Register fleet', 'Set service zones', 'Accept missions', 'Complete deliveries']
  },
];

const IOT_CARDS = [
  { icon: <Thermometer size={22} />, title: 'Soil & Climate Sensors', desc: 'Real-time temperature, humidity, and soil moisture monitoring across connected farms.', color: 'rgba(16,185,129,.2)', ic: '#10B981' },
  { icon: <Satellite size={22} />, title: 'GPS Fleet Tracking', desc: 'Live location tracking for transport vehicles with route optimization and ETA predictions.', color: 'rgba(37,99,235,.2)', ic: '#2563EB' },
  { icon: <Cloud size={22} />, title: 'Weather Intelligence', desc: 'Hyperlocal weather forecasts and agricultural advisories for each wilaya and commune.', color: 'rgba(234,88,12,.2)', ic: '#EA580C' },
  { icon: <ScanLine size={22} />, title: 'Quality Scanning', desc: 'Digital product quality verification and certification tracking from farm to market.', color: 'rgba(124,58,237,.2)', ic: '#7C3AED' },
];

const TESTIMONIALS = [
  { quote: "AgriGov Market transformed how I sell my produce. I now reach buyers across 12 wilayas directly, with fair prices guaranteed.", name: 'Karim B.', role: 'Wheat Farmer, Tiaret', avatar: '#059669', initials: 'KB' },
  { quote: "The official pricing transparency gives me confidence. I know I'm paying fair market value for premium Algerian produce.", name: 'Amina S.', role: 'Restaurant Buyer, Algiers', avatar: '#2563EB', initials: 'AS' },
  { quote: "Managing my fleet and delivery zones is seamless. The GPS tracking and mission system doubled my monthly deliveries.", name: 'Youcef M.', role: 'Fleet Operator, Oran', avatar: '#EA580C', initials: 'YM' },
];

const PARTNERS = [
  { icon: <Landmark size={26} />, title: 'Ministry of Agriculture', desc: 'Official Supervision', color: '#ECFDF5', ic: '#059669' },
  { icon: <Building2 size={26} />, title: 'OAIC', desc: 'Cereals Authority', color: '#EFF6FF', ic: '#2563EB' },
  { icon: <Globe size={26} />, title: 'FAO Algeria', desc: 'Technical Partner', color: '#FFF7ED', ic: '#EA580C' },
  { icon: <Award size={26} />, title: 'INRAA', desc: 'Research Institute', color: '#F5F3FF', ic: '#7C3AED' },
];

const DASH_FEATURES = [
  { icon: <Activity size={22} />, title: 'Crop Monitoring', desc: 'Track growth cycles, yields, and field conditions in real-time.', color: '#ECFDF5', ic: '#059669' },
  { icon: <Eye size={22} />, title: 'Delivery Tracking', desc: 'Live GPS tracking with ETAs and route visualization.', color: '#EFF6FF', ic: '#2563EB' },
  { icon: <TrendingUp size={22} />, title: 'Market Analytics', desc: 'Price trends, demand forecasting, and regional insights.', color: '#FFF7ED', ic: '#EA580C' },
];

/* ═══════════════════════════════════════════════════
   LANDING PAGE COMPONENT
   ═══════════════════════════════════════════════════ */
const LandingPage = () => {
  const [stats, setStats] = useState({ farmers: 2800, wilayas: 58 });

  useEffect(() => {
    api.get('/dashboards/public-stats/')
      .then(res => {
        if (res.data) setStats(res.data);
      })
      .catch(err => console.error("Could not fetch public stats:", err));
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: 'var(--ag-cream)' }}>

      {/* ════ HERO ════ */}
      <section className="ag-hero">
        <div className="ag-hero-grid" />
        <div className="ag-hero-particles">
          {[...Array(6)].map((_, i) => <div key={i} className="ag-hero-particle" />)}
        </div>
        <div className="ag-hero-inner">
          <div>
            <div className="ag-hero-badge"><BadgeCheck size={16} /> Ministry Certified Platform</div>
            <h1>Algeria's <span>Official Agricultural</span> Marketplace</h1>
            <p className="ag-hero-sub">
              AgriGov Market connects producers, buyers, and transporters within a transparent,
              government-supervised digital marketplace. Official pricing, verified users,
              IoT-powered logistics — all in one platform.
            </p>
            <div className="ag-hero-ctas">
              <Link to="/register" className="ag-btn-primary">
                Get Started <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="ag-btn-outline">
                Explore Platform <ChevronRight size={18} />
              </Link>
            </div>
            <div className="ag-hero-trust-row">
              <div className="ag-hero-trust-pill"><CheckCircle size={14} /> Verified Users</div>
              <div className="ag-hero-trust-pill"><BarChart3 size={14} /> Official Prices</div>
              <div className="ag-hero-trust-pill"><Satellite size={14} /> IoT Connected</div>
            </div>
          </div>

          <div className="ag-hero-visual">
            <div className="ag-hero-img-wrap">
              <img src="/images/hero-farm.png" alt="Smart farming in Algeria" loading="eager" />
              <div className="ag-hero-img-overlay" />
            </div>
            <div className="ag-hero-float-card fc1">
              <div className="ag-hero-float-icon" style={{ background: 'rgba(16,185,129,.2)' }}><TrendingUp size={20} color="#10B981" /></div>
              <div><div className="ag-hero-float-title">Live Prices</div><div className="ag-hero-float-sub">Updated daily</div></div>
            </div>
            <div className="ag-hero-float-card fc2">
              <div className="ag-hero-float-icon" style={{ background: 'rgba(37,99,235,.2)' }}><Users size={20} color="#2563EB" /></div>
              <div><div className="ag-hero-float-title"><AnimCounter target={stats.farmers.toString()} suffix="+" /> Farmers</div><div className="ag-hero-float-sub">Verified & Active</div></div>
            </div>
            <div className="ag-hero-float-card fc3">
              <div className="ag-hero-float-icon" style={{ background: 'rgba(234,88,12,.2)' }}><Truck size={20} color="#EA580C" /></div>
              <div><div className="ag-hero-float-title"><AnimCounter target={stats.wilayas.toString()} /> Wilayas</div><div className="ag-hero-float-sub">Full coverage</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ FEATURES ════ */}
      <Section>
        <div className="ag-section-header">
          <div className="ag-section-tag"><Zap size={14} /> Smart Features</div>
          <h2 className="ag-section-title">Why AgriGov Market?</h2>
          <p className="ag-section-sub">A modern agricultural ecosystem built on trust, transparency, and cutting-edge technology.</p>
        </div>
        <div className="ag-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="ag-feature-card">
              <div className="ag-feature-icon" style={{ background: f.color, color: f.ic }}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ════ ABOUT ════ */}
      <Section>
        <div className="ag-about-grid">
          <div className="ag-about-visual">
            <img src="/images/hero-farm.png" alt="AgriGov smart farming" />
          </div>
          <div className="ag-about-content">
            <div className="ag-section-tag" style={{ background: 'none', padding: 0 }}>
              <AgriGovLogo size={32} variant="compact" />
            </div>
            <h2>Modernizing Algeria's Agricultural Trade</h2>
            <p>
              AgriGov Market is a government-supervised digital platform that digitizes the entire
              agricultural supply chain — from farm registration and product listing to order
              management and GPS-tracked logistics. Under the Ministry of Agriculture's oversight,
              every transaction is transparent, every price is referenced, and every user is verified.
            </p>
            <div className="ag-about-stats">
              <div className="ag-about-stat"><div className="ag-about-stat-val">58</div><div className="ag-about-stat-label">Wilayas</div></div>
              <div className="ag-about-stat"><div className="ag-about-stat-val">100%</div><div className="ag-about-stat-label">Digital</div></div>
              <div className="ag-about-stat"><div className="ag-about-stat-val">24/7</div><div className="ag-about-stat-label">Active</div></div>
            </div>
          </div>
        </div>
      </Section>



      {/* ════ IoT + GPS ════ */}
      <Section dark>
        <div className="ag-section-header">
          <div className="ag-section-tag"><Radio size={14} /> IoT & GPS Tracking</div>
          <h2 className="ag-section-title">Connected Agriculture Infrastructure</h2>
          <p className="ag-section-sub">Sensor networks, satellite tracking, and smart monitoring powering precision agriculture.</p>
        </div>
        <div className="ag-iot-grid">
          <div className="ag-iot-cards">
            {IOT_CARDS.map((c, i) => (
              <div key={i} className="ag-iot-card">
                <div className="ag-iot-card-icon" style={{ background: c.color, color: c.ic }}>{c.icon}</div>
                <div><h4>{c.title}</h4><p>{c.desc}</p></div>
              </div>
            ))}
          </div>
          <div className="ag-iot-visual">
            <div className="ag-iot-visual-circle">
              <Wifi size={48} color="rgba(16,185,129,.6)" strokeWidth={1.5} />
              <div className="ag-iot-orbit">
                <div className="ag-iot-orbit-dot" style={{ background: 'rgba(16,185,129,.2)', color: '#10B981' }}><Thermometer size={18} /></div>
              </div>
              <div className="ag-iot-orbit">
                <div className="ag-iot-orbit-dot" style={{ background: 'rgba(37,99,235,.2)', color: '#2563EB' }}><Satellite size={18} /></div>
              </div>
              <div className="ag-iot-orbit">
                <div className="ag-iot-orbit-dot" style={{ background: 'rgba(234,88,12,.2)', color: '#EA580C' }}><Cloud size={18} /></div>
              </div>
            </div>
          </div>
        </div>
      </Section>



      {/* ════ WORKFLOW ════ */}
      <div id="how" />
      <Section green>
        <div className="ag-section-header">
          <div className="ag-section-tag"><Users size={14} /> How It Works</div>
          <h2 className="ag-section-title">Built for Every Stakeholder</h2>
          <p className="ag-section-sub">A platform designed for every actor in the agricultural supply chain.</p>
        </div>
        <div className="ag-workflow-grid">
          {WORKFLOWS.map((w, i) => (
            <div key={i} className="ag-workflow-card">
              <div className="ag-workflow-num">{w.num}</div>
              <div className="ag-workflow-icon" style={{ background: w.color, color: w.ic }}>{w.icon}</div>
              <h3>{w.title}</h3>
              <p>{w.desc}</p>
              <ul className="ag-workflow-list">
                {w.items.map((it, j) => <li key={j}><CheckCircle size={14} style={{ color: w.ic, flexShrink: 0 }} /> {it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>





      {/* ════ CTA ════ */}
      <section className="ag-cta-section">
        <div className="ag-cta-inner">
          <h2>Ready to Join the Future of Agriculture?</h2>
          <p>Create your account, access official prices, and start trading on Algeria's most reliable agricultural platform.</p>
          <div className="ag-cta-actions">
            <Link to="/register" className="ag-btn-primary" style={{ padding: '16px 40px', fontSize: '16px' }}>
              Create Account <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="ag-btn-outline" style={{ padding: '16px 40px', fontSize: '16px' }}>
              Sign In
            </Link>
          </div>
          <div className="ag-cta-footnote"><ShieldCheck size={14} /> Supervised by the Ministry of Agriculture · Free Access · Validation Required</div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
