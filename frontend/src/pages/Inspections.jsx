import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';

export default function Inspections({ userRole }) {
  const [user, setUser] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      fetchInspections(user.id);
    });
  }, []);

  const fetchInspections = async (userId) => {
    try {
      let query = supabase
        .from('inspections')
        .select('*')
        .order('created_at', { ascending: false });

      if (userRole !== 'admin') {
        query = query.eq('inspector_id', userId);
      }

      const { data, error } = await query;
      if (!error) setInspections(data || []);
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, inspectionId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this inspection? This action cannot be undone.')) {
      return;
    }

    setDeleting(inspectionId);
    
    try {
      await api.delete(`/inspections/${inspectionId}`);
      
      // Remove from local state
      setInspections(inspections.filter(i => i.id !== inspectionId));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete inspection: ' + (error.response?.data?.error || error.message));
    } finally {
      setDeleting(null);
    }
  };

  const toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('open');
  };

  return (
    <div className="app-with-sidebar">
      <Sidebar userRole={userRole} user={user} />
      
      <main className="main">
        <header className="topbar">
          <button className="hamburger" onClick={toggleSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="topbar-breadcrumb">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-tertiary)'}}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span>My Inspections</span>
          </div>
        </header>

        <div className="page">
          <div className="page-header">
            <div className="page-header-top">
              <h1 className="page-title">My Inspections</h1>
            </div>
            <p className="page-subtitle">View all your submitted road inspections</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="spinner" style={{width:'32px',height:'32px',margin:'0 auto'}}></div>
            </div>
          ) : inspections.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{width:'64px',height:'64px',margin:'0 auto',color:'var(--text-tertiary)'}}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No inspections yet</h3>
              <p className="text-[var(--text-tertiary)] mb-6">Upload your first road inspection to get started</p>
              <Link to="/upload" className="btn btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload Inspection
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inspections.map((inspection) => (
                <div key={inspection.id} className="card hover:border-[var(--text-primary)] transition-all" style={{position:'relative'}}>
                  <button
                    onClick={(e) => handleDelete(e, inspection.id)}
                    disabled={deleting === inspection.id}
                    className="btn btn-ghost"
                    style={{
                      position:'absolute',
                      top:'12px',
                      right:'12px',
                      padding:'8px',
                      minWidth:'unset',
                      background:'rgba(255,255,255,0.95)',
                      backdropFilter:'blur(8px)',
                      border:'1px solid var(--border)',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
                      zIndex:10,
                      cursor:'pointer'
                    }}
                    title="Delete inspection"
                  >
                    {deleting === inspection.id ? (
                      <div className="spinner" style={{width:'16px',height:'16px'}}></div>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'16px',height:'16px',color:'var(--red)'}}>
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    )}
                  </button>
                  <Link to={`/inspection/${inspection.id}`} style={{textDecoration:'none',color:'inherit',display:'block'}}>
                    <div style={{height:'180px',overflow:'hidden',borderBottom:'1px solid var(--border)'}}>
                      <img src={inspection.annotated_image_url} alt="Inspection" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    </div>
                    <div style={{padding:'16px'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                        <span className={`pill ${inspection.status === 'Critical' ? 'critical' : inspection.status === 'Moderate' ? 'moderate' : 'good'}`}>
                          {inspection.status}
                        </span>
                        <span className="font-mono text-2xl font-bold" style={{color: inspection.status === 'Critical' ? 'var(--red)' : inspection.status === 'Moderate' ? 'var(--yellow)' : 'var(--green)'}}>
                          {inspection.score}
                        </span>
                      </div>
                      <p style={{fontSize:'13px',color:'var(--text-secondary)',marginBottom:'8px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                        {inspection.address || 'Location not available'}
                      </p>
                      <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11.5px',color:'var(--text-tertiary)',fontFamily:'Geist Mono, monospace'}}>
                        <span>{inspection.defect_count || 0} defects</span>
                        <span>·</span>
                        <span>{new Date(inspection.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
