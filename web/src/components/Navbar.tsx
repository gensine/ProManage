import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, User as UserIcon, Layers } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Brand */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Layers size={20} color="#fff" />
          </div>
          <span>Task<span style={{ color: 'var(--primary)' }}>Pulse</span></span>
        </Link>

        {/* Navigation links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/dashboard"
            className={`btn ${isActive('/dashboard') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          <Link
            to="/projects"
            className={`btn ${isActive('/projects') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            <FolderKanban size={16} />
            <span>Projects</span>
          </Link>
        </nav>

        {/* User profile & logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <UserIcon size={16} />
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user?.fullName}</span>
          </div>

          <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
