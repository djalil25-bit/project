import React, { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Settings, 
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
  AlertCircle,
  Truck as TruckIcon,
  ShoppingBag as BagIcon,
  ShieldCheck,
  User as UserIcon,
  X,
  BadgeCheck,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import VerifiedBadge from '../components/common/VerifiedBadge';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data.results || []);
      setUnreadCount(res.data.results?.filter(n => !n.is_read).length || 0);
    } catch (err) { console.error("Notif fetch failed", err); }
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
    switch(type) {
      case 'order_placed': return <BagIcon size={16} className="text-primary" />;
      case 'order_confirmed': return <ShieldCheck size={16} className="text-success" />;
      case 'delivery_request': return <TruckIcon size={16} className="text-warning" />;
      case 'delivery_completed': return <Check size={16} className="text-success" />;
      default: return <Bell size={16} className="text-muted" />;
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const roleLinks = {
    admin: [
      { label: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={20} /> },
      { label: 'Analytics', path: '/admin-dashboard/analytics', icon: <TrendingUp size={20} /> },
      { label: 'Catalog', path: '/admin-dashboard/catalog', icon: <ClipboardList size={20} /> },
      { label: 'Categories', path: '/admin-dashboard/categories', icon: <FolderTree size={20} /> },
      { label: 'Complaint Center', path: '/admin-dashboard/complaints', icon: <ShieldAlert size={20} /> },
    ],
    farmer: [
      { label: 'Dashboard', path: '/farmer-dashboard', icon: <LayoutDashboard size={20} /> },
      { label: 'Statistics', path: '/farmer-dashboard/stats', icon: <TrendingUp size={20} /> },
      { label: 'My Farms', path: '/farmer-dashboard/farms', icon: <Home size={20} /> },
      { label: 'Orders', path: '/farmer/orders', icon: <ShoppingBag size={20} /> },
      { label: 'My Listings', path: '/farmer/products', icon: <Package size={20} /> },
      { label: 'Harvests', path: '/farmer-dashboard/harvests', icon: <CalendarDays size={20} /> },
      { label: 'Complaints', path: '/complaints', icon: <MessageSquare size={20} /> },
    ],
    buyer: [
      { label: 'Marketplace', path: '/buyer-dashboard', icon: <ShoppingCart size={20} /> },
      { label: 'My Cart', path: '/buyer/cart', icon: <ShoppingBag size={20} /> },
      { label: 'My Orders', path: '/buyer-dashboard/orders', icon: <History size={20} /> },
      { label: 'Invoices', path: '/buyer-dashboard/invoices', icon: <CreditCard size={20} /> },
      { label: 'Complaints', path: '/complaints', icon: <MessageSquare size={20} /> },
    ],
    transporter: [
      { label: 'Marketboard', path: '/transporter-dashboard', icon: <Truck size={20} /> },
      { label: 'My Fleet', path: '/transporter-dashboard/vehicles', icon: <Truck size={20} /> },
      { label: 'Zones', path: '/transporter-dashboard/zones', icon: <MapPin size={20} /> },
      { label: 'Complaints', path: '/complaints', icon: <MessageSquare size={20} /> },
    ]
  };

  const currentLinks = roleLinks[user?.role] || [];

  return (
    <div className={`app-container ${sidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand">
            <span className="logo-icon"><Package size={24} color="#10b981" /></span>
            <span className="brand-text">AgriGov</span>
          </Link>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main Menu</div>
          {currentLinks.map((link) => (
            <Link 
              key={link.path} 
              to={link.path} 
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{link.icon}</span>
              <span className="nav-label">{link.label}</span>
            </Link>
          ))}
          
          <div className="nav-section-label mt-4">Account Settings</div>
          <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
            <span className="nav-icon"><UserIcon size={20} /></span>
            <span className="nav-label">My Profile</span>
          </Link>
          <button onClick={logout} className="nav-link logout-btn">
            <span className="nav-icon"><LogOut size={20} /></span>
            <span className="nav-label">Logout</span>
          </button>
        </nav>
      </aside>

      <div className="main-wrapper">
        <header className="app-topbar">
          <div className="topbar-left">
            <h2 className="current-page-title">
              {currentLinks.find(l => l.path === location.pathname)?.label || (location.pathname === '/profile' ? 'Profile' : 'AgriGov Market')}
            </h2>
          </div>
          <div className="topbar-right">
            <div className="notification-wrapper">
              <button 
                className={`notification-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="notif-badge-dot" />}
              </button>
              
              {showNotifDropdown && (
                <div className="notif-center-panel animate-slide-in">
                  <div className="notif-center-header">
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div className="fw-bold d-flex align-items-center gap-2">
                        Notifications {unreadCount > 0 && <span className="unread-count-pill">{unreadCount} new</span>}
                      </div>
                      <div className="d-flex gap-2">
                        {unreadCount > 0 && (
                          <button className="btn-notif-action" onClick={markAllAsRead} title="Mark all as read">
                            <Check size={14} />
                          </button>
                        )}
                        <button className="btn-notif-action" onClick={() => setShowNotifDropdown(false)}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="notif-center-body">
                    {notifications.length === 0 ? (
                      <div className="notif-empty-state">
                        <div className="empty-icon"><Bell size={32} /></div>
                        <div className="empty-text">No active notifications</div>
                        <div className="empty-subtext">We'll let you know when something happens!</div>
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
                            <div className="notif-item-icon">
                              {getNotifIcon(n.type)}
                            </div>
                            <div className="notif-item-content">
                              <div className="notif-item-msg">{n.message}</div>
                              <div className="notif-item-meta">
                                <span className="notif-item-time">{timeAgo(n.created_at)}</span>
                                {!n.is_read && <span className="notif-item-dot" />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="notif-center-footer">
                       <button className="view-all-notifs border-0 bg-transparent w-100 py-2 small text-primary fw-bold" onClick={() => setShowNotifDropdown(false)}>
                         Close Panel
                       </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="user-header-profile" onClick={() => navigate('/profile')}>
              <div className="user-header-info d-none d-md-block text-end">
                <div className="d-flex align-items-center justify-content-end gap-2">
                  <div className="user-header-name">{user?.full_name}</div>
                  <VerifiedBadge role={user?.role} isVerified={user?.is_verified} trustLevel={user?.trust_level} showLabel={false} />
                </div>
                <div className="user-header-role">{user?.role}</div>
              </div>
              <div className="user-header-avatar">
                {user?.profile_picture ? (
                  <img 
                    src={user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:8000${user.profile_picture}`} 
                    alt={user.full_name} 
                    className="avatar-img"
                  />
                ) : (
                  <div className={`avatar-placeholder avatar-role-${user?.role}`}>
                    {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
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
