import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ 
    totalInspections: 0, 
    criticalZones: 0, 
    avgScore: 0,
    totalDefects: 0,
    statusBreakdown: { Good: 0, Moderate: 0, Critical: 0 },
    recentInspections: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('open');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" style={{width:'32px',height:'32px'}}></div>
      </div>
    );
  }

  return (
    <>
      <Sidebar userRole="admin" user={user} />
      <main className="main">
        <header className="topbar">
          <button className="hamburger" onClick={toggleSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="topbar-breadcrumb">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-tertiary)'}}>
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span>Dashboard</span>
          </div>
          <div className="topbar-actions">
            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
              <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'var(--green)'}} className="pulse-dot"></span>
              <span style={{fontSize:'11.5px',color:'var(--green)',fontWeight:500,fontFamily:'Geist Mono, monospace'}}>Live</span>
            </div>
          </div>
        </header>

        <div className="page">
          <div className="page-header">
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Monitor all road inspections across the city</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-6">
              <div style={{fontSize:'11.5px',fontWeight:600,letterSpacing:'0.5px',textTransform:'uppercase',color:'var(--text-tertiary)',marginBottom:'12px'}}>Total Inspections</div>
              <div className="font-mono text-4xl font-bold">{stats.totalInspections}</div>
            </div>
            <div className="card p-6">
              <div style={{fontSize:'11.5px',fontWeight:600,letterSpacing:'0.5px',textTransform:'uppercase',color:'var(--text-tertiary)',marginBottom:'12px'}}>Critical Zones</div>
              <div className="font-mono text-4xl font-bold text-[var(--red)]">{stats.criticalZones}</div>
            </div>
            <div className="card p-6">
              <div style={{fontSize:'11.5px',fontWeight:600,letterSpacing:'0.5px',textTransform:'uppercase',color:'var(--text-tertiary)',marginBottom:'12px'}}>Average Score</div>
              <div className="font-mono text-4xl font-bold">{stats.avgScore}</div>
            </div>
            <div className="card p-6">
              <div style={{fontSize:'11.5px',fontWeight:600,letterSpacing:'0.5px',textTransform:'uppercase',color:'var(--text-tertiary)',marginBottom:'12px'}}>Total Defects</div>
              <div className="font-mono text-4xl font-bold text-[var(--yellow)]">{stats.totalDefects}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Inspections</div>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',fontSize:'13px'}}>
                <thead style={{borderBottom:'1px solid var(--border)',background:'var(--surface-2)'}}>
                  <tr>
                    <th style={{padding:'12px 16px',textAlign:'left',fontWeight:600,fontSize:'11.5px',textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-tertiary)'}}>Location</th>
                    <th style={{padding:'12px 16px',textAlign:'left',fontWeight:600,fontSize:'11.5px',textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-tertiary)'}}>Score</th>
                    <th style={{padding:'12px 16px',textAlign:'left',fontWeight:600,fontSize:'11.5px',textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-tertiary)'}}>Status</th>
                    <th style={{padding:'12px 16px',textAlign:'left',fontWeight:600,fontSize:'11.5px',textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-tertiary)'}}>Defects</th>
                    <th style={{padding:'12px 16px',textAlign:'left',fontWeight:600,fontSize:'11.5px',textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-tertiary)'}}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentInspections.map((inspection) => (
                    <tr 
                      key={inspection.id} 
                      style={{borderBottom:'1px solid var(--border-subtle)',cursor:'pointer'}}
                      onClick={() => navigate(`/inspection/${inspection.id}`)}
                    >
                      <td style={{padding:'12px 16px'}}>{inspection.address?.substring(0, 40) || 'Unknown'}</td>
                      <td style={{padding:'12px 16px'}}><span className="font-mono font-semibold">{inspection.score}</span></td>
                      <td style={{padding:'12px 16px'}}>
                        <span className={`pill ${inspection.status === 'Critical' ? 'critical' : inspection.status === 'Moderate' ? 'moderate' : 'good'}`}>
                          {inspection.status}
                        </span>
                      </td>
                      <td style={{padding:'12px 16px'}}><span className="font-mono">{inspection.defect_count || 0}</span></td>
                      <td style={{padding:'12px 16px'}}><span className="font-mono text-[var(--text-tertiary)]" style={{fontSize:'12px'}}>{new Date(inspection.created_at).toLocaleDateString()}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
