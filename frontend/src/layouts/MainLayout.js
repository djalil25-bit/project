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
  const location = useLocation();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const langRef = useRef(null);

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
      { label: t('nav_catalog'), path: '/admin-dashboard/catalog', icon: <ClipboardList size={18} /> },
      { label: t('nav_categories'), path: '/admin-dashboard/categories', icon: <FolderTree size={18} /> },
      { label: t('nav_complaint_center'), path: '/admin-dashboard/complaints', icon: <ShieldAlert size={18} /> },
    ],
    farmer: [
      { label: t('nav_dashboard'), path: '/farmer-dashboard', icon: <LayoutDashboard size={18} /> },
      { label: t('nav_statistics'), path: '/farmer-dashboard/stats', icon: <TrendingUp size={18} /> },
      { label: t('nav_my_farms'), path: '/farmer-dashboard/farms', icon: <Home size={18} /> },
      { label: t('nav_orders'), path: '/farmer/orders', icon: <ShoppingBag size={18} /> },
      { label: t('nav_my_listings'), path: '/farmer/products', icon: <Package size={18} /> },
      { label: t('nav_harvests'), path: '/farmer-dashboard/harvests', icon: <CalendarDays size={18} /> },
      { label: t('nav_complaints'), path: '/complaints', icon: <MessageSquare size={18} /> },
    ],
    buyer: [
      { label: t('nav_marketplace'), path: '/buyer-dashboard', icon: <ShoppingCart size={18} /> },
      { label: t('nav_my_wishlist'), path: '/buyer-dashboard/wishlist', icon: <Heart size={18} /> },
      { label: t('nav_my_cart'), path: '/buyer/cart', icon: <ShoppingBag size={18} /> },
      { label: t('nav_my_orders'), path: '/buyer-dashboard/orders', icon: <History size={18} /> },
      { label: t('nav_invoices'), path: '/buyer-dashboard/invoices', icon: <CreditCard size={18} /> },
      { label: t('nav_complaints'), path: '/complaints', icon: <MessageSquare size={18} /> },
    ],
    transporter: [
      { label: t('nav_marketboard'), path: '/transporter-dashboard', icon: <Truck size={18} /> },
      { label: t('nav_my_fleet'), path: '/transporter-dashboard/vehicles', icon: <Truck size={18} /> },
      { label: t('nav_zones'), path: '/transporter-dashboard/zones', icon: <MapPin size={18} /> },
      { label: t('nav_complaints'), path: '/complaints', icon: <MessageSquare size={18} /> },
    ],
  };

  const currentLinks = roleLinks[user?.role] || [];

  const roleAccents = {
    buyer: '#2563eb',
    farmer: '#16a34a',
    transporter: '#d97706',
    admin: '#475569',
  };
  const accent = roleAccents[user?.role] || 'var(--primary)';

  const currentPageLabel = currentLinks.find(l => l.path === location.pathname)?.label
    || (location.pathname === '/profile' ? t('nav_my_profile') : 'AgriGov Market');

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>

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

        <nav className="sidebar-nav">
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
                  {user?.profile_picture ? (
                    <img
                      src={user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:8000${user.profile_picture}`}
                      alt={user.full_name}
                      className="avatar-img"
                    />
                  ) : (
                    <div className={`avatar-placeholder avatar-role-${user?.role}`} style={{ borderColor: accent }}>
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <ChevronDown size={14} className="user-menu-chevron" />
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar" style={{ background: `${accent}20`, borderColor: accent }}>
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
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
