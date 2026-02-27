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
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setInspection(data);
      setRepairStatus(data.repair_status || 'pending');
      setEstimatedDate(data.estimated_completion_date || '');
      setAdminNotes(data.admin_notes || '');
      setCompletionDate(data.completion_date || '');
      setFeedback(data.user_feedback || '');
      setRating(data.user_rating || 0);
    }
    setLoading(false);
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
              {/* Before Image */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Before - Annotated Image</div>
                  <span className="pill critical">Defects Found</span>
                </div>
                <img src={inspection.annotated_image_url} alt="Before" style={{width:'100%'}}/>
              </div>

              {/* After Image (if completed) */}
              {inspection.after_image_url && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">After - Repaired Road</div>
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
                        <div style={{fontSize:'20px'}}>
                          {defect.class.toLowerCase().includes('pothole') ? '🕳️' : 
                           defect.class.toLowerCase().includes('alligator') ? '🔶' : '〰️'}
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
                  <div className="section-title" style={{marginBottom:'16px'}}>Admin Actions</div>
                  
                  {inspection.repair_status !== 'completed' && (
                    <>
                      <div style={{marginBottom:'16px'}}>
                        <label style={{display:'block',fontSize:'12px',fontWeight:600,marginBottom:'6px',color:'var(--text-secondary)'}}>Repair Status</label>
                        <select 
                          value={repairStatus} 
                          onChange={(e) => setRepairStatus(e.target.value)}
                          style={{width:'100%',padding:'8px 12px',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'13px'}}
                        >
                          <option value="pending">Pending Review</option>
                          <option value="in_progress">In Progress</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                      {repairStatus === 'in_progress' && (
                        <div style={{marginBottom:'16px'}}>
                          <label style={{display:'block',fontSize:'12px',fontWeight:600,marginBottom:'6px',color:'var(--text-secondary)'}}>Estimated Completion Date</label>
                          <input 
                            type="date" 
                            value={estimatedDate}
                            onChange={(e) => setEstimatedDate(e.target.value)}
                            style={{width:'100%',padding:'8px 12px',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'13px',fontFamily:'Geist Mono'}}
                          />
                        </div>
                      )}

                      <div style={{marginBottom:'16px'}}>
                        <label style={{display:'block',fontSize:'12px',fontWeight:600,marginBottom:'6px',color:'var(--text-secondary)'}}>Admin Notes</label>
                        <textarea 
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes about the repair work..."
                          rows={3}
                          style={{width:'100%',padding:'8px 12px',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'13px',resize:'vertical'}}
                        />
                      </div>

                      <button 
                        className="btn btn-primary" 
                        onClick={handleUpdateStatus}
                        disabled={updating}
                        style={{width:'100%',marginBottom:'16px'}}
                      >
                        {updating ? 'Updating...' : 'Update Status'}
                      </button>

                      <div style={{borderTop:'1px solid var(--border)',paddingTop:'16px',marginTop:'16px'}}>
                        <div style={{fontSize:'14px',fontWeight:600,marginBottom:'12px'}}>Mark as Completed</div>
                        <div style={{marginBottom:'12px'}}>
                          <label style={{display:'block',fontSize:'12px',fontWeight:600,marginBottom:'6px',color:'var(--text-secondary)'}}>After Image (Required)</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setAfterImage(e.target.files[0])}
                            style={{width:'100%',padding:'8px',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'13px'}}
                          />
                          {afterImage && (
                            <div style={{marginTop:'8px',fontSize:'12px',color:'var(--teal)'}}>
                              ✓ {afterImage.name}
                            </div>
                          )}
                        </div>

                        <div style={{marginBottom:'12px'}}>
                          <label style={{display:'block',fontSize:'12px',fontWeight:600,marginBottom:'6px',color:'var(--text-secondary)'}}>Completion Date</label>
                          <input 
                            type="date" 
                            value={completionDate}
                            onChange={(e) => setCompletionDate(e.target.value)}
                            style={{width:'100%',padding:'8px 12px',borderRadius:'6px',border:'1px solid var(--border)',fontSize:'13px',fontFamily:'Geist Mono'}}
                          />
                        </div>

                        <button 
                          className="btn btn-teal" 
                          onClick={handleComplete}
                          disabled={!afterImage || updating}
                          style={{width:'100%'}}
                        >
                          {updating ? 'Completing...' : 'Complete Inspection'}
                        </button>
                      </div>
                    </>
                  )}

                  {inspection.repair_status === 'completed' && (
                    <div style={{padding:'16px',background:'var(--green-bg)',border:'1px solid var(--green-border)',borderRadius:'8px',textAlign:'center'}}>
                      <div style={{fontSize:'14px',fontWeight:600,color:'var(--green)',marginBottom:'4px'}}>✓ Inspection Completed</div>
                      <div style={{fontSize:'12px',color:'var(--text-secondary)'}}>
                        Completed on {new Date(inspection.completion_date).toLocaleDateString()}
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
                          style={{fontSize:'28px',background:'none',border:'none',cursor:'pointer',padding:0}}
                        >
                          {star <= rating ? '⭐' : '☆'}
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

              {/* SHOW FEEDBACK (if already submitted) */}
              {inspection.user_feedback && (
                <div className="card p-6">
                  <div className="section-title" style={{marginBottom:'16px'}}>User Feedback</div>
                  {inspection.user_rating && (
                    <div style={{marginBottom:'12px',fontSize:'20px'}}>
                      {'⭐'.repeat(inspection.user_rating)}{'☆'.repeat(5 - inspection.user_rating)}
                    </div>
                  )}
                  <p style={{fontSize:'13px',color:'var(--text-primary)',lineHeight:'1.6',padding:'12px',background:'var(--surface-2)',borderRadius:'8px'}}>
                    {inspection.user_feedback}
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
