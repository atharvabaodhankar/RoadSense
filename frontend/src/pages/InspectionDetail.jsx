import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import LocationMap from '../components/LocationMap';

export default function InspectionDetail({ userRole }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchInspection();
  }, [id]);

  const fetchInspection = async () => {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setInspection(data);
    }
    setLoading(false);
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

  if (!inspection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Inspection not found</h2>
          <button onClick={() => navigate('/inspections')} className="btn btn-primary">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar userRole={userRole} user={user} />
      <main className="main">
        <header className="topbar">
          <button className="hamburger" onClick={toggleSidebar}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="topbar-breadcrumb">
            <button onClick={() => navigate('/inspections')} style={{background:'none',border:'none',color:'var(--text-tertiary)',cursor:'pointer',padding:0}}>
              Inspections
            </button>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span>Detail</span>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost" onClick={() => navigate('/inspections')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back
            </button>
          </div>
        </header>

        <div className="page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Annotated Image</div>
                </div>
                <img src={inspection.annotated_image_url} alt="Annotated" style={{width:'100%'}}/>
              </div>

              <div className="card p-6">
                <div className="section-title" style={{marginBottom:'16px'}}>Location</div>
                <LocationMap lat={inspection.lat} lng={inspection.lng} editable={false} />
                <div style={{marginTop:'12px'}}>
                  <p style={{fontSize:'13px',fontWeight:500,marginBottom:'4px'}}>{inspection.address}</p>
                  <p className="font-mono text-xs text-[var(--text-tertiary)]">{inspection.lat.toFixed(6)}°N  {inspection.lng.toFixed(6)}°E</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <div className="section-title" style={{marginBottom:'16px'}}>Road Quality Score</div>
                <div style={{display:'flex',alignItems:'end',gap:'12px',marginBottom:'16px'}}>
                  <span className="font-mono text-5xl font-bold" style={{color: inspection.status === 'Critical' ? 'var(--red)' : inspection.status === 'Moderate' ? 'var(--yellow)' : 'var(--green)'}}>
                    {inspection.score}
                  </span>
                  <span className="font-mono text-[var(--text-tertiary)]" style={{marginBottom:'8px'}}>/100</span>
                </div>
                <span className={`pill ${inspection.status === 'Critical' ? 'critical' : inspection.status === 'Moderate' ? 'moderate' : 'good'}`}>
                  {inspection.status}
                </span>
              </div>

              {inspection.defects && inspection.defects.length > 0 && (
                <div className="card p-6">
                  <div className="section-title" style={{marginBottom:'16px'}}>
                    Detected Defects
                    <span className="font-mono font-semibold text-[var(--red)]" style={{fontSize:'12px'}}>{inspection.defects.length} found</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {inspection.defects.map((defect, idx) => (
                      <div key={idx} className="defect-row">
                        <div className="defect-emoji">
                          {defect.class.toLowerCase().includes('pothole') ? '🕳' : 
                           defect.class.toLowerCase().includes('alligator') ? '🔶' : '〰'}
                        </div>
                        <div className="defect-info">
                          <div className="defect-name">{defect.class}</div>
                          <div className="defect-conf">{(defect.confidence * 100).toFixed(1)}% confidence</div>
                        </div>
                        <div className="defect-penalty">
                          {defect.class.toLowerCase().includes('pothole') ? '−15 pts' :
                           defect.class.toLowerCase().includes('alligator') ? '−10 pts' : '−5 pts'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card p-6">
                <div className="section-title" style={{marginBottom:'16px'}}>Inspection Details</div>
                <div style={{display:'flex',flexDirection:'column',gap:'12px',fontSize:'13px'}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'var(--text-secondary)'}}>Date</span>
                    <span className="font-mono">{new Date(inspection.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'var(--text-secondary)'}}>Defect Count</span>
                    <span className="font-mono">{inspection.defect_count || 0}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'var(--text-secondary)'}}>Status</span>
                    <span className="font-mono">{inspection.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
