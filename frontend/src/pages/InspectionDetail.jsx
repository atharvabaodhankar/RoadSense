import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import LocationMap from '../components/LocationMap';
import api from '../lib/api';

export default function InspectionDetail({ userRole }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Admin workflow states
  const [repairStatus, setRepairStatus] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [afterImage, setAfterImage] = useState(null);
  const [completionDate, setCompletionDate] = useState('');
  const [updating, setUpdating] = useState(false);
  
  // User feedback states
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(0);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    fetchInspection();
  }, [id]);

  const fetchInspection = async () => {
    try {
      const response = await api.get(`/inspections/${id}`);
      const data = response.data;
      
      setInspection(data);
      setRepairStatus(data.repair_status || 'pending');
      setEstimatedDate(data.estimated_completion_date || '');
      setAdminNotes(data.admin_notes || '');
      setCompletionDate(data.completion_date || '');
      setFeedback(data.user_feedback || '');
      setRating(data.user_rating || 0);
    } catch (error) {
      console.error('Fetch inspection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      await api.patch(`/workflow/${id}/status`, {
        repair_status: repairStatus,
        estimated_completion_date: estimatedDate || null,
        admin_notes: adminNotes
      });
      await fetchInspection();
      alert('Status updated successfully!');
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update status: ' + (error.response?.data?.error || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleComplete = async () => {
    if (!afterImage) {
      alert('Please upload an after image to complete the inspection');
      return;
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('after_image', afterImage);
      formData.append('completion_date', completionDate || new Date().toISOString().split('T')[0]);
      formData.append('admin_notes', adminNotes);

      await api.post(`/workflow/${id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchInspection();
      alert('Inspection marked as completed!');
      setAfterImage(null);
    } catch (error) {
      console.error('Complete error:', error);
      alert('Failed to complete: ' + (error.response?.data?.error || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      alert('Please enter your feedback');
      return;
    }

    setSubmittingFeedback(true);
    try {
      await api.post(`/workflow/${id}/feedback`, {
        user_feedback: feedback,
        user_rating: rating
      });

      await fetchInspection();
      alert('Thank you for your feedback!');
    } catch (error) {
      console.error('Feedback error:', error);
      alert('Failed to submit feedback: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('open');
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#d97706';
      case 'in_progress': return '#2563eb';
      case 'completed': return '#16a34a';
      case 'rejected': return '#dc2626';
      default: return '#8F8F8B';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'pending': return 'Pending Review';
      case 'in_progress': return 'Repair In Progress';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return status;
    }
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

  const isInspector = userRole !== 'admin';
  const isOwnInspection = user?.id === inspection.inspector_id;
  const canAddFeedback = isInspector && isOwnInspection && inspection.repair_status === 'completed' && !inspection.user_feedback;

  return (
    <div className="app-with-sidebar">
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

        <div className="page" style={{maxWidth:'1200px',margin:'0 auto'}}>
          {/* Repair Status Banner */}
          <div className="card" style={{marginBottom:'24px',background:`linear-gradient(135deg, ${getStatusColor(inspection.repair_status)}15 0%, ${getStatusColor(inspection.repair_status)}05 100%)`,border:`1px solid ${getStatusColor(inspection.repair_status)}40`}}>
            <div style={{padding:'20px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <div style={{width:'48px',height:'48px',borderRadius:'12px',background:getStatusColor(inspection.repair_status),display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'24px',height:'24px'}}>
                    {inspection.repair_status === 'completed' && <><polyline points="20 6 9 17 4 12"/></>}
                    {inspection.repair_status === 'in_progress' && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
                    {inspection.repair_status === 'pending' && <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
                    {inspection.repair_status === 'rejected' && <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
                  </svg>
                </div>
                <div>
                  <div style={{fontSize:'18px',fontWeight:600,color:getStatusColor(inspection.repair_status),marginBottom:'4px'}}>
                    {getStatusLabel(inspection.repair_status)}
                  </div>
                  {inspection.estimated_completion_date && inspection.repair_status === 'in_progress' && (
                    <div style={{fontSize:'12px',color:'var(--text-secondary)'}}>
                      Estimated completion: {new Date(inspection.estimated_completion_date).toLocaleDateString()}
                    </div>
                  )}
                  {inspection.completion_date && inspection.repair_status === 'completed' && (
                    <div style={{fontSize:'12px',color:'var(--text-secondary)'}}>
                      Completed on: {new Date(inspection.completion_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
              {inspection.admin_notes && (
                <div style={{flex:'1',minWidth:'300px',padding:'12px',background:'rgba(255,255,255,0.7)',borderRadius:'8px',border:'1px solid var(--border)'}}>
                  <div style={{fontSize:'11px',fontWeight:600,color:'var(--text-tertiary)',marginBottom:'4px',textTransform:'uppercase'}}>Admin Notes</div>
                  <div style={{fontSize:'13px',color:'var(--text-primary)'}}>{inspection.admin_notes}</div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Original Image */}
              {inspection.original_image_url && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Original Image</div>
                    <span className="pill moderate">Reported</span>
                  </div>
                  <img src={inspection.original_image_url} alt="Original" style={{width:'100%'}}/>
                </div>
              )}

              {/* Before Image (Annotated) */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">AI Analysis</div>
                  <span className="pill critical">Defects Detected</span>
                </div>
                <img src={inspection.annotated_image_url} alt="Annotated" style={{width:'100%'}}/>
              </div>

              {/* After Image (if completed) */}
              {inspection.after_image_url && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">After Repair</div>
                    <span className="pill good">Completed</span>
                  </div>
                  <img src={inspection.after_image_url} alt="After" style={{width:'100%'}}/>
                </div>
              )}

              {/* Location */}
              <div className="card p-6">
                <div className="section-title" style={{marginBottom:'16px'}}>Location</div>
                <LocationMap lat={inspection.lat} lng={inspection.lng} editable={false} />
                <div style={{marginTop:'12px'}}>
                  <p style={{fontSize:'13px',fontWeight:500,marginBottom:'4px'}}>{inspection.address}</p>
                  <p className="font-mono text-xs text-[var(--text-tertiary)]">{inspection.lat.toFixed(6)}°N  {inspection.lng.toFixed(6)}°E</p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* Score */}
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

              {/* Defects */}
              {inspection.defects && inspection.defects.length > 0 && (
                <div className="card p-6">
                  <div className="section-title" style={{marginBottom:'16px'}}>
                    Detected Defects
                    <span className="font-mono font-semibold text-[var(--red)]" style={{fontSize:'12px'}}>{inspection.defects.length} found</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {inspection.defects.map((defect, idx) => (
                      <div key={idx} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px',background:'var(--surface-2)',borderRadius:'8px'}}>
                        <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'var(--red-bg)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'18px',height:'18px'}}>
                            {defect.class.toLowerCase().includes('pothole') ? (
                              <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
                            ) : defect.class.toLowerCase().includes('alligator') ? (
                              <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="7.5 4.21 12 6.81 16.5 4.21"/><polyline points="7.5 19.79 7.5 14.6 3 12"/><polyline points="21 12 16.5 14.6 16.5 19.79"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>
                            ) : (
                              <><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></>
                            )}
                          </svg>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'13px',fontWeight:500}}>{defect.class}</div>
                          <div style={{fontSize:'11px',color:'var(--text-tertiary)'}}>{(defect.confidence * 100).toFixed(1)}% confidence</div>
                        </div>
                        <div style={{fontSize:'12px',fontWeight:600,color:'var(--red)',fontFamily:'Geist Mono'}}>
                          {defect.class.toLowerCase().includes('pothole') ? '−15 pts' :
                           defect.class.toLowerCase().includes('alligator') ? '−10 pts' : '−5 pts'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADMIN WORKFLOW PANEL */}
              {userRole === 'admin' && (
                <div className="card p-6">
                  <div style={{fontSize:'14px',fontWeight:600,marginBottom:'20px',textTransform:'uppercase',letterSpacing:'0.5px',color:'var(--text-tertiary)'}}>Admin Actions</div>
                  
                  {inspection.repair_status !== 'completed' && (
                    <>
                      <div style={{marginBottom:'20px'}}>
                        <label style={{display:'block',fontSize:'13px',fontWeight:600,marginBottom:'8px',color:'var(--text-primary)'}}>Repair Status</label>
                        <select 
                          value={repairStatus} 
                          onChange={(e) => setRepairStatus(e.target.value)}
                          style={{width:'100%',padding:'10px 14px',borderRadius:'8px',border:'1px solid var(--border)',fontSize:'14px',background:'var(--surface)',cursor:'pointer'}}
                        >
                          <option value="pending">Pending Review</option>
                          <option value="in_progress">In Progress</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      {repairStatus === 'in_progress' && (
                        <div style={{marginBottom:'20px',padding:'16px',background:'var(--blue-bg)',border:'1px solid var(--blue-border)',borderRadius:'8px'}}>
                          <label style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',fontWeight:600,marginBottom:'8px',color:'var(--blue)'}}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'16px',height:'16px'}}>
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            Estimated Completion Date
                          </label>
                          <input 
                            type="date" 
                            value={estimatedDate}
                            onChange={(e) => setEstimatedDate(e.target.value)}
                            style={{width:'100%',padding:'10px 14px',borderRadius:'8px',border:'1px solid var(--blue-border)',fontSize:'14px',fontFamily:'Geist Mono',background:'white'}}
                          />
                        </div>
                      )}

                      <div style={{marginBottom:'20px'}}>
                        <label style={{display:'block',fontSize:'13px',fontWeight:600,marginBottom:'8px',color:'var(--text-primary)'}}>Admin Notes</label>
                        <textarea 
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes about the repair work, timeline, or any issues..."
                          rows={4}
                          style={{width:'100%',padding:'12px 14px',borderRadius:'8px',border:'1px solid var(--border)',fontSize:'13px',resize:'vertical',lineHeight:'1.5',background:'var(--surface)'}}
                        />
                      </div>

                      <button 
                        className="btn btn-primary" 
                        onClick={handleUpdateStatus}
                        disabled={updating}
                        style={{width:'100%',marginBottom:'24px',padding:'12px',fontSize:'14px',fontWeight:600}}
                      >
                        {updating ? (
                          <>
                            <div className="spinner" style={{width:'14px',height:'14px'}}></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Update Status
                          </>
                        )}
                      </button>

                      <div style={{borderTop:'2px solid var(--border)',paddingTop:'24px',marginTop:'8px'}}>
                        <div style={{fontSize:'16px',fontWeight:600,marginBottom:'16px',display:'flex',alignItems:'center',gap:'8px'}}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'20px',height:'20px',color:'var(--green)'}}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          <span>Mark as Completed</span>
                        </div>
                        
                        <div style={{marginBottom:'20px'}}>
                          <label style={{display:'block',fontSize:'13px',fontWeight:600,marginBottom:'8px',color:'var(--text-primary)'}}>
                            After Image <span style={{color:'var(--red)',fontSize:'12px'}}>(Required)</span>
                          </label>
                          <div style={{position:'relative'}}>
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => setAfterImage(e.target.files[0])}
                              id="afterImageInput"
                              style={{display:'none'}}
                            />
                            <label 
                              htmlFor="afterImageInput"
                              style={{
                                display:'flex',
                                alignItems:'center',
                                justifyContent:'center',
                                gap:'10px',
                                padding:'16px',
                                borderRadius:'8px',
                                border:'2px dashed var(--border)',
                                background:'var(--surface-2)',
                                cursor:'pointer',
                                transition:'all 0.2s',
                                ':hover': {background:'var(--surface)'}
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                            >
                              {!afterImage ? (
                                <>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'24px',height:'24px',color:'var(--teal)'}}>
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21 15 16 10 5 21"/>
                                  </svg>
                                  <div style={{textAlign:'left'}}>
                                    <div style={{fontSize:'14px',fontWeight:600,color:'var(--text-primary)'}}>Upload After Image</div>
                                    <div style={{fontSize:'12px',color:'var(--text-tertiary)'}}>Click to browse or drag and drop</div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'24px',height:'24px',color:'var(--green)'}}>
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                  <div style={{textAlign:'left',flex:1}}>
                                    <div style={{fontSize:'14px',fontWeight:600,color:'var(--green)'}}>{afterImage.name}</div>
                                    <div style={{fontSize:'12px',color:'var(--text-tertiary)'}}>
                                      {(afterImage.size / 1024 / 1024).toFixed(2)} MB • Click to change
                                    </div>
                                  </div>
                                </>
                              )}
                            </label>
                          </div>
                        </div>

                        <div style={{marginBottom:'20px'}}>
                          <label style={{display:'block',fontSize:'13px',fontWeight:600,marginBottom:'8px',color:'var(--text-primary)'}}>Completion Date</label>
                          <input 
                            type="date" 
                            value={completionDate}
                            onChange={(e) => setCompletionDate(e.target.value)}
                            style={{width:'100%',padding:'10px 14px',borderRadius:'8px',border:'1px solid var(--border)',fontSize:'14px',fontFamily:'Geist Mono',background:'var(--surface)'}}
                          />
                        </div>

                        <button 
                          className="btn btn-teal" 
                          onClick={handleComplete}
                          disabled={!afterImage || updating}
                          style={{width:'100%',padding:'12px',fontSize:'14px',fontWeight:600}}
                        >
                          {updating ? (
                            <>
                              <div className="spinner" style={{width:'14px',height:'14px'}}></div>
                              Completing...
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                              </svg>
                              Complete Inspection
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}

                  {inspection.repair_status === 'completed' && (
                    <div style={{padding:'20px',background:'linear-gradient(135deg, var(--green)15 0%, var(--green)05 100%)',border:'1px solid var(--green-border)',borderRadius:'12px',textAlign:'center'}}>
                      <div style={{width:'64px',height:'64px',margin:'0 auto 16px',borderRadius:'50%',background:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{width:'36px',height:'36px'}}>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <div style={{fontSize:'16px',fontWeight:600,color:'var(--green)',marginBottom:'6px'}}>Inspection Completed</div>
                      <div style={{fontSize:'13px',color:'var(--text-secondary)',fontFamily:'Geist Mono'}}>
                        {new Date(inspection.completion_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* USER FEEDBACK PANEL */}
              {canAddFeedback && (
                <div className="card p-6">
                  <div className="section-title" style={{marginBottom:'16px'}}>Add Your Feedback</div>
                  <p style={{fontSize:'13px',color:'var(--text-secondary)',marginBottom:'16px'}}>
                    The repair work has been completed. Please share your feedback about the quality of the repair.
                  </p>

                  <div style={{marginBottom:'16px'}}>
                    <label style={{display:'block',fontSize:'12px',fontWeight:600,marginBottom:'8px',color:'var(--text-secondary)'}}>Rating</label>
                    <div style={{display:'flex',gap:'8px'}}>
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          style={{width:'36px',height:'36px',background:'none',border:'none',cursor:'pointer',padding:0,borderRadius:'4px',transition:'transform 0.2s'}}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <svg viewBox="0 0 24 24" fill={star <= rating ? '#fbbf24' : 'none'} stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'28px',height:'28px'}}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{marginBottom:'16px'}}>
                    <label style={{display:'block',fontSize:'12px',fontWeight:600,marginBottom:'6px',color:'var(--text-secondary)'}}>Your Feedback</label>
                    <textarea 
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="How is the quality of the repair? Any issues?"
                      rows={4}
                      style={{width:'100%',padding:'8px 12px',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'13px',resize:'vertical'}}
                    />
                  </div>

                  <button 
                    className="btn btn-primary" 
                    onClick={handleSubmitFeedback}
                    disabled={submittingFeedback || !feedback.trim()}
                    style={{width:'100%'}}
                  >
                    {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              )}

              {/* SHOW FEEDBACK (to everyone if submitted) */}
              {inspection.user_feedback && (
                <div className="card p-6">
                  <div className="section-title" style={{marginBottom:'16px'}}>
                    {userRole === 'admin' ? 'User Feedback' : 'Your Feedback'}
                  </div>
                  {inspection.user_rating && (
                    <div style={{marginBottom:'12px',display:'flex',gap:'4px'}}>
                      {[1,2,3,4,5].map(star => (
                        <svg key={star} viewBox="0 0 24 24" fill={star <= inspection.user_rating ? '#fbbf24' : 'none'} stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'20px',height:'20px'}}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                      <span style={{marginLeft:'8px',fontSize:'13px',color:'var(--text-secondary)',fontFamily:'Geist Mono'}}>
                        {inspection.user_rating}/5
                      </span>
                    </div>
                  )}
                  <p style={{fontSize:'13px',color:'var(--text-primary)',lineHeight:'1.6',padding:'12px',background:'var(--surface-2)',borderRadius:'8px',border:'1px solid var(--border)'}}>
                    "{inspection.user_feedback}"
                  </p>
                  <div style={{fontSize:'11px',color:'var(--text-tertiary)',marginTop:'8px',fontFamily:'Geist Mono'}}>
                    Submitted on {new Date(inspection.feedback_at).toLocaleDateString()}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="card p-6">
                <div className="section-title" style={{marginBottom:'16px'}}>Inspection Details</div>
                <div style={{display:'flex',flexDirection:'column',gap:'12px',fontSize:'13px'}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'var(--text-secondary)'}}>Reported Date</span>
                    <span className="font-mono">{new Date(inspection.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'var(--text-secondary)'}}>Defect Count</span>
                    <span className="font-mono">{inspection.defect_count || 0}</span>
                  </div>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <span style={{color:'var(--text-secondary)'}}>Condition</span>
                    <span className="font-mono">{inspection.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
