import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import api from '../api/axiosConfig';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  TrendingUp,
  ShoppingCart,
  History,
  Truck,
  MapPin,
  CreditCard,
  LogOut,
  Bell,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CalendarDays,
  Home,
  Check,
  CheckCircle,
  Moon,
  Sun,
  Globe,
  ShoppingBag as BagIcon,
  ShieldCheck,
  User as UserIcon,
  X,
  MessageSquare,
  ShieldAlert,
  Heart,
  ChevronDown,
  Tractor,
  Wheat,
  Sprout,
  Leaf,
  BarChart3,
  ListOrdered,
  Users,
  Activity,
  Wifi,
  Zap
} from 'lucide-react';

import VerifiedBadge from '../components/common/VerifiedBadge';
import AgriGovLogo from '../components/common/AgriGovLogo';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [iotAlertCount, setIotAlertCount] = useState(0);
  const [iotHasDanger, setIotHasDanger] = useState(false);
  const [adminIotSummary, setAdminIotSummary] = useState(null);
  const location = useLocation();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const langRef = useRef(null);

  // Fetch IoT alert badge count for farmer sidebar
  useEffect(() => {
    if (user?.role !== 'farmer') return;
    const fetchIotAlerts = () => {
      api.get('/farms/')
        .then(res => {
          const farms = res.data.results || res.data;
          if (farms && farms.length > 0) {
            return api.get(`/iot/alerts/${farms[0].id}/`);
          }
          return null;
        })
        .then(res => {
          if (res) {
            setIotAlertCount(res.data.alerts_count || 0);
            setIotHasDanger(res.data.has_danger || false);
          }
        })
        .catch(err => console.error('[IoT badge] fetch error:', err));
    };
    fetchIotAlerts();
    const interval = setInterval(fetchIotAlerts, 600000);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch IoT badge for admin sidebar (Fixed)
  useEffect(() => {
    if (user?.role !== 'admin') return;
    
    let isMounted = true;
    const fetchAdminIot = async () => {
      try {
        const res = await api.get('/iot/admin/overview/');
        if (!isMounted || !res.data) return;
        
        let summary = res.data.summary;
        if (!summary) {
          const crit = res.data.critical_alerts || [];
          const warn = res.data.warning_alerts || [];
          summary = { farms_danger: crit.length, farms_warning: warn.length };
        }
        setAdminIotSummary(summary);
      } catch (err) {
        console.error('[Admin IoT badge] fetch error:', err);
        if (isMounted) setAdminIotSummary({ farms_danger: 0, farms_warning: 0 });
      }
    };

    fetchAdminIot();
    const interval = setInterval(fetchAdminIot, 600000); // 10 mins
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false);
      if (langRef.current && !langRef.current.contains(e.target)) setShowLangMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.results || []);
      setUnreadCount(res.data.results?.filter(n => !n.is_read).length || 0);
    } catch (err) { console.error('Notif fetch failed', err); }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read/`);
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'order_placed': return <BagIcon size={14} style={{ color: 'var(--primary)' }} />;
      case 'order_confirmed': return <ShieldCheck size={14} style={{ color: 'var(--success)' }} />;
      case 'delivery_request': return <Truck size={14} style={{ color: 'var(--warning)' }} />;
      case 'delivery_completed': return <Check size={14} style={{ color: 'var(--success)' }} />;
      default: return <Bell size={14} style={{ color: 'var(--gray-400)' }} />;
    }
  };

  const roleLinks = {
    admin: [
      { label: t('nav_dashboard'), path: '/admin-dashboard', icon: <LayoutDashboard size={18} /> },
      { label: t('nav_analytics'), path: '/admin-dashboard/analytics', icon: <TrendingUp size={18} /> },

      { label: t('nav_transactions'), path: '/admin-dashboard/transactions', icon: <ShoppingBag size={18} /> },
      { label: t('nav_accounts'), path: '/admin-dashboard/accounts', icon: <Users size={18} /> },
      { label: t('nav_messages'), path: '/admin-dashboard/messages', icon: <MessageSquare size={18} /> },
      { label: 'IoT Overview', path: '/admin-dashboard/iot', icon: <Wifi size={18} />, adminIotBadge: true },
      { label: 'Catalog', path: '/admin-dashboard/catalog', icon: <ClipboardList size={18} /> },
      { label: t('nav_categories'), path: '/admin-dashboard/categories', icon: <FolderTree size={18} /> },
      { label: t('nav_complaint_center'), path: '/admin-dashboard/complaints', icon: <ShieldAlert size={18} /> },
      { label: 'Approvals Registry', path: '/admin-dashboard/resource-approvals', icon: <ShieldCheck size={18} /> },
    ],

    farmer: [
      { label: t('nav_dashboard'), path: '/farmer-dashboard', icon: <LayoutDashboard size={18} strokeWidth={2.2} /> },
      { label: t('nav_statistics'), path: '/farmer-dashboard/stats', icon: <BarChart3 size={18} strokeWidth={2.2} /> },
      { label: t('nav_my_farms'), path: '/farmer-dashboard/farms', icon: <Tractor size={18} strokeWidth={2.2} /> },
      { label: t('nav_harvests'), path: '/farmer-dashboard/harvests', icon: <Wheat size={18} strokeWidth={2.2} /> },
      { label: 'IoT Alerts', path: '/farmer-dashboard/iot-alerts', icon: <Activity size={18} strokeWidth={2.2} />, badge: iotAlertCount, badgeDanger: iotHasDanger },
      { label: t('nav_orders'), path: '/farmer-dashboard/orders', icon: <ListOrdered size={18} strokeWidth={2.2} /> },
      { label: t('nav_my_products'), path: '/farmer-dashboard/products', icon: <Sprout size={18} strokeWidth={2.2} /> },
      { label: t('nav_complaints'), path: '/complaints', icon: <ShieldAlert size={18} strokeWidth={2.2} /> },
    ],
    buyer: [
      { label: t('nav_marketplace'), path: '/buyer-dashboard', icon: <ShoppingCart size={18} /> },
      { label: t('nav_my_wishlist'), path: '/buyer-dashboard/wishlist', icon: <Heart size={18} /> },
      { label: t('nav_my_cart'), path: '/buyer/cart', icon: <ShoppingBag size={18} /> },
      { label: t('nav_my_orders'), path: '/buyer-dashboard/orders', icon: <History size={18} /> },
      { label: t('nav_invoices'), path: '/buyer-dashboard/invoices', icon: <CreditCard size={18} /> },
      { label: t('nav_complaints'), path: '/complaints', icon: <ShieldAlert size={18} /> },
    ],
    transporter: [
      { label: 'Missions', path: '/transporter-dashboard', icon: <Truck size={18} /> },
      { label: t('nav_my_fleet'), path: '/transporter-dashboard/vehicles', icon: <Truck size={18} /> },
      { label: t('nav_zones'), path: '/transporter-dashboard/zones', icon: <MapPin size={18} /> },
      { label: t('nav_complaints'), path: '/complaints', icon: <ShieldAlert size={18} /> },
    ],
  };

  const currentLinks = roleLinks[user?.role] || [];

  const roleAccents = {
    buyer: '#0F766E',
    farmer: '#22543d',
    transporter: '#10B981',
    admin: '#064e3b',
  };
  const accent = roleAccents[user?.role] || 'var(--primary)';

  const currentPageLabel = currentLinks.find(l => l.path === location.pathname)?.label
    || (location.pathname === '/profile' ? t('nav_my_profile') : 'AgriGov Market');

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'} ${user?.role === 'admin' ? 'admin-mode' : ''}`}>

      {/* ── SIDEBAR ─────────────────────────────── */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" style={{ textDecoration: 'none' }}>
            {sidebarOpen
              ? <AgriGovLogo size={28} variant="full" />
              : <AgriGovLogo size={28} variant="compact" />
            }
          </Link>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Role accent bar */}
        {sidebarOpen && user?.role && (
          <div className="sidebar-role-bar" style={{ background: accent }}>
            <span className="sidebar-role-label">
              {t(`role_${user.role}`)}
            </span>
          </div>
        )}

        <nav className="sidebar-nav no-scrollbar">
          <div className="nav-section-label">{t('main_menu')}</div>
          {currentLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              style={location.pathname === link.path ? { color: accent, background: `${accent}15` } : {}}
            >
              <span className="nav-icon" style={location.pathname === link.path ? { color: accent } : {}}>{link.icon}</span>
              <span className="nav-label">{link.label}</span>
              {link.badge > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: link.badgeDanger ? '#dc2626' : '#d97706',
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 10,
                  minWidth: 18,
                  textAlign: 'center',
                  lineHeight: '16px',
                  boxShadow: link.badgeDanger ? '0 0 8px rgba(220,38,38,0.4)' : '0 0 6px rgba(217,119,6,0.3)',
                }}>
                  {link.badge}
                </span>
              )}
              {link.adminIotBadge && adminIotSummary && user?.role === 'admin' && location.pathname.includes('/admin') && (
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                  {adminIotSummary.farms_danger > 0 ? (
                    <span style={{ background: '#ef4444', color: 'white', borderRadius: '999px', fontSize: '11px', padding: '2px 7px', animation: 'pulse 1s infinite' }}>
                      {adminIotSummary.farms_danger}
                    </span>
                  ) : adminIotSummary.farms_warning > 0 ? (
                    <span style={{ background: '#f97316', color: 'white', borderRadius: '999px', fontSize: '11px', padding: '2px 7px' }}>
                      {adminIotSummary.farms_warning}
                    </span>
                  ) : (
                    <span style={{ background: '#22c55e', width: '8px', height: '8px', borderRadius: '50%' }} />
                  )}
                  <style>{`
                    @keyframes pulse {
                      0% { transform: scale(1); }
                      50% { transform: scale(1.1); }
                      100% { transform: scale(1); }
                    }
                  `}</style>
                </div>
              )}
              {location.pathname === link.path && (
                <span className="nav-active-indicator" style={{ background: accent }} />
              )}
            </Link>
          ))}

          <div className="nav-section-label mt-4">{t('account_settings')}</div>
          <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
            <span className="nav-icon"><UserIcon size={18} /></span>
            <span className="nav-label">{t('nav_my_profile')}</span>
          </Link>
        </nav>
      </aside>

      {/* ── MAIN WRAPPER ───────────────────────── */}
      <div className="main-wrapper">

        {/* ── TOP BAR ──────────────────────────── */}
        <header className="app-topbar">
          <div className="topbar-left">
            <h2 className="current-page-title">{currentPageLabel}</h2>
          </div>

          <div className="topbar-right">

            {/* Language Switcher */}
            <div className="topbar-control-group" ref={langRef}>
              <button
                className="topbar-icon-btn"
                onClick={() => { setShowLangMenu(!showLangMenu); setShowNotifDropdown(false); setShowUserMenu(false); }}
                title="Language"
                aria-label="Switch language"
              >
                <Globe size={18} />
                <span className="topbar-lang-label">{lang.toUpperCase()}</span>
              </button>
              {showLangMenu && (
                <div className="topbar-dropdown lang-dropdown">
                  {[
                    { code: 'en', label: 'English', flag: '🇬🇧' },
                    { code: 'fr', label: 'Français', flag: '🇫🇷' },
                    { code: 'ar', label: 'العربية', flag: '🇩🇿' },
                  ].map(l => (
                    <button
                      key={l.code}
                      className={`lang-option ${lang === l.code ? 'active' : ''}`}
                      onClick={() => { setLang(l.code); setShowLangMenu(false); }}
                    >
                      <span className="lang-flag">{l.flag}</span>
                      <span className="lang-name">{l.label}</span>
                      {lang === l.code && <Check size={13} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              className="topbar-icon-btn theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'light' ? t('topbar_theme_dark') : t('topbar_theme_light')}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {/* Messages Inbox Shortcut (All Users) */}
            <button
              className={`topbar-icon-btn notif-btn`}
              onClick={() => { 
                navigate(user?.role === 'admin' ? '/admin-dashboard/messages?tab=inbox' : '/messages'); 
                setShowNotifDropdown(false); setShowUserMenu(false); setShowLangMenu(false); 
              }}
              title="Messages"
              aria-label="Messages"
            >
              <MessageSquare size={18} />
              {/* Note: Unread message count badge can be implemented here via an API endpoint */}
            </button>

            {/* Notifications */}
            <div className="notification-wrapper" ref={notifRef}>
              <button
                className={`topbar-icon-btn notif-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => { setShowNotifDropdown(!showNotifDropdown); setShowUserMenu(false); setShowLangMenu(false); }}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="notif-badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>

              {showNotifDropdown && (
                <div className="notif-center-panel">
                  <div className="notif-center-header">
                    <div className="notif-header-title">
                      <Bell size={15} />
                      {t('topbar_notifications')}
                      {unreadCount > 0 && <span className="unread-count-pill">{unreadCount} new</span>}
                    </div>
                    <div className="notif-header-actions">
                      {unreadCount > 0 && (
                        <button className="btn-notif-action" onClick={markAllAsRead} title={t('topbar_mark_all_read')}>
                          <Check size={13} />
                        </button>
                      )}
                      <button className="btn-notif-action" onClick={() => setShowNotifDropdown(false)}>
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="notif-center-body">
                    {notifications.length === 0 ? (
                      <div className="notif-empty-state">
                        <div className="notif-empty-icon"><Bell size={28} /></div>
                        <div className="notif-empty-text">{t('topbar_no_notifications')}</div>
                        <div className="notif-empty-sub">{t('topbar_notif_sub')}</div>
                      </div>
                    ) : (
                      <div className="notif-items-list">
                        {notifications.map(n => (
                          <div
                            key={n.id}
                            className={`notif-center-item ${!n.is_read ? 'unread' : ''}`}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) navigate(n.link);
                              setShowNotifDropdown(false);
                            }}
                          >
                            <div className="notif-item-icon">{getNotifIcon(n.type)}</div>
                            <div className="notif-item-content">
                              <div className="notif-item-msg">{n.message}</div>
                              <div className="notif-item-time">{timeAgo(n.created_at)}</div>
                            </div>
                            {!n.is_read && <div className="notif-item-dot" />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="notif-center-footer">
                      <button className="notif-close-btn" onClick={() => setShowNotifDropdown(false)}>
                        {t('topbar_close')} Panel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Dropdown */}
            <div className="user-menu-wrapper" ref={userMenuRef}>
              <button
                className="user-header-profile"
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifDropdown(false); setShowLangMenu(false); }}
                aria-label="User menu"
              >
                <div className="user-header-info">
                  <div className="user-header-name-row">
                    <span className="user-header-name">{user?.full_name}</span>
                    <VerifiedBadge role={user?.role} isVerified={user?.is_verified} trustLevel={user?.trust_level} showLabel={false} />
                  </div>
                  <div className="user-header-role">{t(`role_${user?.role}`)}</div>
                </div>
                <div className="user-header-avatar">
                  {(user?.profile_image || user?.profile_picture) ? (
                    <img
                      src={`${(user.profile_image || user.profile_picture).startsWith('http') ? (user.profile_image || user.profile_picture) : `http://localhost:8000${user.profile_image || user.profile_picture}`}?t=${new Date().getTime()}`}
                      alt={user.full_name}
                      className="avatar-img"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                    />
                  ) : (
                    <div className={`avatar-placeholder avatar-role-${user?.role}`} style={{ borderColor: accent, background: user?.role === 'admin' ? '#064e3b' : accent, color: 'white' }}>
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <ChevronDown size={14} className="user-menu-chevron" />
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar" style={{ background: `${accent}20`, borderColor: accent, overflow: 'hidden' }}>
                      {(user?.profile_image || user?.profile_picture) ? (
                        <img
                          src={`${(user.profile_image || user.profile_picture).startsWith('http') ? (user.profile_image || user.profile_picture) : `http://localhost:8000${user.profile_image || user.profile_picture}`}?t=${new Date().getTime()}`}
                          alt={user.full_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        user?.full_name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div>
                      <div className="user-dropdown-name">{user?.full_name}</div>
                      <div className="user-dropdown-email">{user?.email}</div>
                    </div>
                  </div>
                  <div className="user-dropdown-divider" />
                  <button
                    className="user-dropdown-item"
                    onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                  >
                    <UserIcon size={15} />
                    {t('nav_my_profile')}
                  </button>
                  <div className="user-dropdown-divider" />
                  <button
                    className="user-dropdown-item user-dropdown-logout"
                    onClick={() => { logout(); setShowUserMenu(false); }}
                  >
                    <LogOut size={15} />
                    {t('nav_logout')}
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        <main className="page-content">
          <div className="container-fluid">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
