import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Sidebar({ userRole, user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div className="sidebar-overlay" id="overlay" onClick={() => {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('open');
      }}></div>

      <aside className="sidebar" id="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <img src="/roadsense.png" alt="RoadSense" className="w-4 h-4" />
          </div>
          <div>
            <div className="logo-text">RoadSense</div>
            <div className="logo-badge">{userRole === 'admin' ? 'Admin' : 'Inspector'}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {userRole === 'admin' ? (
            <>
              <div className="nav-section-label">Admin</div>
              <Link className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                </svg>
                Dashboard
              </Link>
              <Link className={`nav-item ${isActive('/map') ? 'active' : ''}`} to="/map">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                  <path d="M2 12h20"/>
                </svg>
                City Heatmap
              </Link>
            </>
          ) : null}

          <div className="nav-section-label">Inspector</div>
          <Link className={`nav-item ${isActive('/upload') ? 'active' : ''}`} to="/upload">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Upload Inspection
          </Link>
          <Link className={`nav-item ${isActive('/inspections') ? 'active' : ''}`} to="/inspections">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            My Inspections
          </Link>
          <Link className={`nav-item ${isActive('/map') ? 'active' : ''}`} to="/map">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
              <path d="M2 12h20"/>
            </svg>
            City Map
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={handleLogout} style={{ cursor: 'pointer' }}>
            <div className="user-avatar">
              {user?.email?.substring(0, 2).toUpperCase() || 'IN'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.email || 'Inspector'}</div>
              <div className="user-role">{userRole === 'admin' ? 'Administrator' : 'Field Inspector'}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
