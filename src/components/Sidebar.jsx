import {
    CalendarCheck,
    LayoutDashboard,
    LogOut,
    Music2,
    Star,
    Tag,
    Users
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/artists', label: 'Artists', icon: Music2 },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/reviews', label: 'Reviews', icon: Star },
];

export default function Sidebar() {
  const { admin, logout } = useAuth();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🕉️</div>
        <div>
          <div className="logo-text">Shobhnam</div>
          <div className="logo-sub">Admin Panel</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="admin-badge">
          <div className="admin-avatar">
            {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="admin-info">
            <div className="admin-name">{admin?.name || 'Admin'}</div>
            <div className="admin-role">Administrator</div>
          </div>
          <button
            onClick={logout}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
