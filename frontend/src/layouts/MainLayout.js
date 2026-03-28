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
  User, 
  LogOut, 
  Bell, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  CalendarDays,
  Home
} from 'lucide-react';

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
      await api.post(`/notifications/${id}/mark_read/`);
      fetchNotifications();
    } catch (err) { console.error(err); }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const roleLinks = {
    admin: [
      { label: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={20} /> },
      { label: 'Catalog', path: '/admin-dashboard/catalog', icon: <ClipboardList size={20} /> },
      { label: 'Categories', path: '/admin-dashboard/categories', icon: <FolderTree size={20} /> },
    ],
    farmer: [
      { label: 'Dashboard', path: '/farmer-dashboard', icon: <LayoutDashboard size={20} /> },
      { label: 'My Farms', path: '/farmer-dashboard/farms', icon: <Home size={20} /> },
      { label: 'Orders', path: '/farmer/orders', icon: <ShoppingBag size={20} /> },
      { label: 'Products', path: '/farmer-dashboard/product/new', icon: <Package size={20} /> },
      { label: 'Harvests', path: '/farmer-dashboard/harvests', icon: <CalendarDays size={20} /> },
    ],
    buyer: [
      { label: 'Marketplace', path: '/buyer-dashboard', icon: <ShoppingCart size={20} /> },
      { label: 'My Cart', path: '/buyer/cart', icon: <ShoppingBag size={20} /> },
      { label: 'My Orders', path: '/buyer-dashboard/orders', icon: <History size={20} /> },
    ],
    transporter: [
      { label: 'Marketboard', path: '/transporter-dashboard', icon: <Truck size={20} /> },
      { label: 'My Fleet', path: '/transporter-dashboard/vehicles', icon: <Truck size={20} /> },
      { label: 'Zones', path: '/transporter-dashboard/zones', icon: <MapPin size={20} /> },
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
            <span className="nav-icon"><User size={20} /></span>
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
              <div className="notification-bell" onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </div>
              
              {showNotifDropdown && (
                <div className="notif-dropdown agr-card shadow-lg animate-slide-in">
                  <div className="notif-header border-bottom">
                    <span className="fw-bold">Notifications</span>
                    <button className="btn btn-link btn-sm text-decoration-none" onClick={() => setShowNotifDropdown(false)}>Close</button>
                  </div>
                  <div className="notif-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted small">No notifications yet</div>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => markAsRead(n.id)}>
                        <div className="notif-content">
                          <div className="notif-message small">{n.message}</div>
                          <div className="notif-time text-muted mt-1" style={{ fontSize: '0.65rem' }}>{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                        {!n.is_read && <div className="unread-dot"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="user-profile-summary" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
              <div className="user-info">
                <span className="user-name">{user?.full_name}</span>
                <span className={`user-role-badge role-${user?.role}`}>{user?.role}</span>
              </div>
              <div className="user-avatar-small">
                {user?.full_name?.split(' ').map(n=>n[0]).join('').toUpperCase() || 'U'}
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
