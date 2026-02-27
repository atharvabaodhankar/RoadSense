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
  const [deleteModal, setDeleteModal] = useState({ show: false, inspectionId: null });

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
      
      if (error) {
        console.error('Supabase error:', error);
        setInspections([]);
        setLoading(false);
        return;
      }

      // For admin, fetch inspector emails separately
      if (userRole === 'admin' && data && data.length > 0) {
        const inspectorIds = [...new Set(data.map(i => i.inspector_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', inspectorIds);

        // Map emails to inspections
        const profileMap = {};
        profiles?.forEach(p => {
          profileMap[p.id] = p.email;
        });

        const inspectionsWithEmails = data.map(inspection => ({
          ...inspection,
          inspector_email: profileMap[inspection.inspector_id] || 'Unknown'
        }));

        setInspections(inspectionsWithEmails);
      } else {
        setInspections(data || []);
      }
    } catch (error) {
      console.error('Error fetching inspections:', error);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (e, inspectionId) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({ show: true, inspectionId });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, inspectionId: null });
  };

  const confirmDelete = async () => {
    const inspectionId = deleteModal.inspectionId;
    setDeleting(inspectionId);
    closeDeleteModal();
    
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
            <span>{userRole === 'admin' ? 'All Inspections' : 'My Inspections'}</span>
          </div>
        </header>

        <div className="page">
          <div className="page-header">
            <div className="page-header-top">
              <h1 className="page-title">{userRole === 'admin' ? 'All Inspections' : 'My Inspections'}</h1>
            </div>
            <p className="page-subtitle">
              {userRole === 'admin' 
                ? 'View all road inspections submitted by field inspectors' 
                : 'View all your submitted road inspections'}
            </p>
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
              <p className="text-[var(--text-tertiary)] mb-6">
                {userRole === 'admin' 
                  ? 'No inspections have been submitted by field inspectors yet' 
                  : 'Upload your first road inspection to get started'}
              </p>
              {userRole !== 'admin' && (
                <Link to="/upload" className="btn btn-primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Upload Inspection
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inspections.map((inspection) => (
                <div key={inspection.id} style={{position:'relative'}}>
                  <button
                    onClick={(e) => {
                      console.log('BUTTON CLICKED!', inspection.id);
                      openDeleteModal(e, inspection.id);
                    }}
                    disabled={deleting === inspection.id}
                    style={{
                      position:'absolute',
                      top:'12px',
                      right:'12px',
                      padding:'8px',
                      minWidth:'unset',
                      background:'rgba(255,255,255,0.95)',
                      backdropFilter:'blur(8px)',
                      border:'1px solid #e5e5e0',
                      borderRadius:'6px',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.1)',
                      zIndex:100,
                      cursor:'pointer',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'center'
                    }}
                    title="Delete inspection"
                  >
                    {deleting === inspection.id ? (
                      <div className="spinner" style={{width:'16px',height:'16px'}}></div>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'16px',height:'16px',color:'#dc2626'}}>
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    )}
                  </button>
                  <Link to={`/inspection/${inspection.id}`} className="card hover:border-[var(--text-primary)] transition-all" style={{textDecoration:'none',color:'inherit',display:'block'}}>
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
                      <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'11.5px',color:'var(--text-tertiary)',fontFamily:'Geist Mono, monospace',marginBottom:'6px'}}>
                        <span>{inspection.defect_count || 0} defects</span>
                        <span>·</span>
                        <span>{new Date(inspection.created_at).toLocaleDateString()}</span>
                      </div>
                      {userRole === 'admin' && inspection.inspector_email && (
                        <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11px',color:'var(--text-tertiary)',paddingTop:'6px',borderTop:'1px solid var(--border)'}}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'12px',height:'12px'}}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span>{inspection.inspector_email}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <>
          <div 
            style={{
              position:'fixed',
              top:0,
              left:0,
              right:0,
              bottom:0,
              background:'rgba(0,0,0,0.5)',
              backdropFilter:'blur(4px)',
              zIndex:9998,
              animation:'fadeIn 0.2s ease-out'
            }}
            onClick={closeDeleteModal}
          />
          <div
            style={{
              position:'fixed',
              top:'50%',
              left:'50%',
              transform:'translate(-50%, -50%)',
              background:'var(--bg)',
              borderRadius:'12px',
              boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
              zIndex:9999,
              width:'90%',
              maxWidth:'440px',
              animation:'slideUp 0.2s ease-out'
            }}
          >
            <div style={{padding:'24px'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:'16px',marginBottom:'20px'}}>
                <div style={{
                  width:'48px',
                  height:'48px',
                  borderRadius:'50%',
                  background:'#fef2f2',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  flexShrink:0
                }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'24px',height:'24px',color:'#dc2626'}}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <div style={{flex:1}}>
                  <h3 style={{fontSize:'18px',fontWeight:600,color:'var(--text-primary)',marginBottom:'8px'}}>
                    Delete Inspection
                  </h3>
                  <p style={{fontSize:'14px',color:'var(--text-secondary)',lineHeight:'1.5'}}>
                    Are you sure you want to delete this inspection? This action cannot be undone and all associated data will be permanently removed.
                  </p>
                </div>
              </div>
              <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
                <button 
                  className="btn btn-ghost"
                  onClick={closeDeleteModal}
                  style={{minWidth:'100px'}}
                >
                  Cancel
                </button>
                <button 
                  className="btn"
                  onClick={confirmDelete}
                  style={{
                    minWidth:'100px',
                    background:'#dc2626',
                    color:'white',
                    border:'1px solid #dc2626'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
