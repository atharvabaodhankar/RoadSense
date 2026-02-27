import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import LocationMap from '../components/LocationMap';
import api from '../lib/api';

export default function Upload({ userRole }) {
  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [editingLocation, setEditingLocation] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLoadingLocation(false);
        },
        (error) => {
          setLocationError(error.message);
          setLoadingLocation(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported');
      setLoadingLocation(false);
    }
  }, []);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleRedetectLocation = () => {
    setLoadingLocation(true);
    setLocationError(null);
    setEditingLocation(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLoadingLocation(false);
      },
      (error) => {
        setLocationError(error.message);
        setLoadingLocation(false);
      }
    );
  };

  const handleEditLocation = () => {
    setEditingLocation(true);
    setManualLat(location?.lat.toFixed(6) || '');
    setManualLng(location?.lng.toFixed(6) || '');
  };

  const handleSaveLocation = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setLocationError('Invalid coordinates');
      return;
    }

    setLocation({
      lat,
      lng,
      accuracy: 0
    });
    setEditingLocation(false);
    setLocationError(null);
  };

  const handleCancelEdit = () => {
    setEditingLocation(false);
    setManualLat('');
    setManualLng('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedImage) {
      setError('Please select an image');
      return;
    }

    if (!location) {
      setError('GPS location is required');
      return;
    }

    setUploading(true);
    setShowLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('lat', location.lat);
      formData.append('lng', location.lng);
      formData.append('timestamp', new Date().toISOString());

      const response = await api.post('/inspect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setTimeout(() => {
        setResult(response.data.inspection);
        setShowLoading(false);
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to process inspection');
      setShowLoading(false);
    } finally {
      setUploading(false);
    }
  };

  const resetPage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setShowLoading(false);
  };

  const toggleSidebar = () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('open');
  };

  return (
    <div className="app-with-sidebar">
      <Sidebar userRole={userRole} user={user} />
      
      <main className="main">
        {/* Topbar */}
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
            <span>Upload Inspection</span>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost" onClick={resetPage}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
              </svg>
              Reset
            </button>
          </div>
        </header>

        <div className="page">
          {/* Page Header */}
          <div className="page-header">
            <div className="page-header-top">
              <h1 className="page-title">Upload Inspection</h1>
            </div>
            <p className="page-subtitle">Photograph a road, let AI detect defects and compute a quality score</p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 gap-5 items-start">
            {/* LEFT: Form */}
            <div className="flex flex-col gap-4">
              {/* GPS Card */}
              <div className="card" style={{animationDelay:'0.1s'}}>
                <div className="card-header">
                  <div className="card-header-left">
                    <div className="card-icon teal">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'16px',height:'16px'}}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div>
                      <div className="card-title">GPS Location</div>
                      <div className="card-desc">Auto-detected from your device</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    {!editingLocation && (
                      <>
                        <button className="btn btn-ghost" style={{fontSize:'12px'}} onClick={handleEditLocation}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'13px',height:'13px'}}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          Edit
                        </button>
                        <button className="btn btn-ghost" style={{fontSize:'12px'}} onClick={handleRedetectLocation}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'13px',height:'13px'}}>
                            <polyline points="1 4 1 10 7 10"/>
                            <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                          </svg>
                          Re-detect
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  {loadingLocation ? (
                    <div className="gps-status detecting">
                      <div className="gps-dot" style={{background:'var(--yellow)',boxShadow:'0 0 0 3px rgba(202,138,4,0.2)'}}></div>
                      <div className="gps-status-text">
                        <div className="gps-status-label" style={{color:'var(--yellow)'}}>Detecting location...</div>
                        <div className="gps-status-sub">Accessing device GPS</div>
                      </div>
                    </div>
                  ) : locationError ? (
                    <div className="gps-status error">
                      <div className="gps-dot" style={{background:'var(--red)',boxShadow:'0 0 0 3px rgba(220,38,38,0.2)'}}></div>
                      <div className="gps-status-text">
                        <div className="gps-status-label" style={{color:'var(--red)'}}>Location error</div>
                        <div className="gps-status-sub">{locationError}</div>
                      </div>
                    </div>
                  ) : location ? (
                    <>
                      {!editingLocation ? (
                        <>
                          <div className="gps-status">
                            <div className="gps-dot"></div>
                            <div className="gps-status-text">
                              <div className="gps-status-label">Location {location.accuracy === 0 ? 'set manually' : 'detected'}</div>
                              <div className="gps-status-sub">{location.accuracy === 0 ? 'Manual coordinates' : 'High accuracy · Updated just now'}</div>
                            </div>
                            <span className="pill good">Active</span>
                          </div>

                          <LocationMap 
                            lat={location.lat} 
                            lng={location.lng}
                            editable={false}
                          />

                          <div className="gps-coords-row" style={{marginTop:'12px'}}>
                            <div className="coord-box">
                              <div className="coord-label">Latitude</div>
                              <div className="coord-value">{location.lat.toFixed(6)}°N</div>
                            </div>
                            <div className="coord-box">
                              <div className="coord-label">Longitude</div>
                              <div className="coord-value">{location.lng.toFixed(6)}°E</div>
                            </div>
                          </div>

                          {location.accuracy > 0 && (
                            <div className="accuracy-row">
                              <span className="accuracy-pill">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{width:'10px',height:'10px'}}>
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                ±{Math.round(location.accuracy)}m accuracy
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                          <div className="gps-status" style={{background:'var(--blue-bg)',borderColor:'#bfdbfe'}}>
                            <div className="gps-dot" style={{background:'var(--blue)',boxShadow:'0 0 0 3px rgba(37,99,235,0.2)'}}></div>
                            <div className="gps-status-text">
                              <div className="gps-status-label" style={{color:'var(--blue)'}}>Editing location</div>
                              <div className="gps-status-sub">Click on map or drag marker to set location</div>
                            </div>
                          </div>

                          <LocationMap 
                            lat={parseFloat(manualLat) || location.lat} 
                            lng={parseFloat(manualLng) || location.lng}
                            editable={true}
                            onLocationChange={(newLat, newLng) => {
                              setManualLat(newLat.toFixed(6));
                              setManualLng(newLng.toFixed(6));
                            }}
                          />

                          <div className="gps-coords-row">
                            <div>
                              <div className="coord-label">Latitude</div>
                              <input
                                type="number"
                                step="0.000001"
                                value={manualLat}
                                onChange={(e) => setManualLat(e.target.value)}
                                placeholder="18.524600"
                                style={{width:'100%',padding:'8px 10px',fontSize:'13px',fontFamily:'Geist Mono, monospace'}}
                              />
                            </div>
                            <div>
                              <div className="coord-label">Longitude</div>
                              <input
                                type="number"
                                step="0.000001"
                                value={manualLng}
                                onChange={(e) => setManualLng(e.target.value)}
                                placeholder="73.878600"
                                style={{width:'100%',padding:'8px 10px',fontSize:'13px',fontFamily:'Geist Mono, monospace'}}
                              />
                            </div>
                          </div>

                          <div style={{display:'flex',gap:'8px'}}>
                            <button className="btn btn-ghost" onClick={handleCancelEdit} style={{flex:1}}>
                              Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSaveLocation} style={{flex:1}}>
                              Save Location
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {/* Upload Card */}
              <div className="card" style={{animationDelay:'0.15s'}}>
                <div className="card-header">
                  <div className="card-header-left">
                    <div className="card-icon blue">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'16px',height:'16px'}}>
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <div className="card-title">Road Photo</div>
                      <div className="card-desc">Clear daylight photos give best results</div>
                    </div>
                  </div>
                  {selectedImage && <span className="pill moderate">1 photo</span>}
                </div>
                <div className="card-body" style={{paddingBottom:'16px'}}>
                  <div className={`upload-zone ${selectedImage ? 'has-file' : ''}`} onClick={() => !selectedImage && document.getElementById('fileInput').click()}>
                    <input
                      type="file"
                      id="fileInput"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleImageSelect}
                      style={{display:'none'}}
                    />

                    {!selectedImage ? (
                      <div className="empty-state">
                        <div className="upload-icon-wrap">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                        </div>
                        <div className="upload-main-text">Drop your road photo here</div>
                        <div className="upload-sub-text">or <strong>browse files</strong> from your device</div>
                        <div className="upload-types">
                          <span className="upload-type-tag">JPG</span>
                          <span className="upload-type-tag">PNG</span>
                          <span className="upload-type-tag">Up to 10MB</span>
                        </div>
                      </div>
                    ) : (
                      <div className="preview-state show">
                        <img className="preview-img" src={imagePreview} alt="Road preview"/>
                        <div className="preview-meta">
                          <div className="preview-file-info">
                            <div className="preview-file-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'16px',height:'16px',color:'var(--teal)'}}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                              </svg>
                            </div>
                            <div>
                              <div className="preview-file-name">{selectedImage.name}</div>
                              <div className="preview-file-size">{(selectedImage.size / 1024 / 1024).toFixed(1)} MB</div>
                            </div>
                          </div>
                          <span className="preview-change" onClick={(e) => { e.stopPropagation(); document.getElementById('fileInput').click(); }}>Change</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Analyze Button */}
              <button
                className="analyze-btn"
                onClick={handleSubmit}
                disabled={!selectedImage || !location || uploading}
              >
                {uploading ? (
                  <>
                    <div className="spinner"></div>
                    Sending to AI...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Analyze Road Condition
                  </>
                )}
              </button>

              {error && (
                <div className="bg-[var(--red-bg)] border border-[var(--red-border)] text-[var(--red)] px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* RIGHT: Result Panel */}
            <div className="sticky top-[70px]">
              {(showLoading || result) && (
                <div className="result-panel">

                {/* Loading State */}
                {showLoading && (
                  <div className="result-loading show">
                    <div className="loading-header">
                      <div className="loading-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'32px',height:'32px',color:'var(--teal)'}}>
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 16v-4"/>
                          <path d="M12 8h.01"/>
                        </svg>
                      </div>
                      <div className="loading-title">AI is analyzing your road photo</div>
                      <div className="loading-sub">YOLOv8 road damage detection model</div>
                    </div>
                    <div className="loading-steps-list">
                      <div className="loading-step">
                        <div className="loading-step-icon active">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'16px',height:'16px'}}>
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg>
                        </div>
                        <div className="loading-step-text">
                          <div className="loading-step-label">Processing image</div>
                          <div className="loading-step-status active-text">Running detection...</div>
                        </div>
                        <div className="loading-step-state">
                          <div className="spinner"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Result Content */}
                {result && !showLoading && (
                  <div className="result-content show">
                    <div className="score-header">
                      <div className="score-label">Road Quality Score</div>
                      <div className="score-number">{result.score}</div>
                      <div>
                        <span className={`score-pill-status ${result.status === 'Critical' ? 'critical' : result.status === 'Moderate' ? 'moderate' : 'good'}`}>
                          <span className="score-pill-dot"></span>
                          {result.status} Condition
                        </span>
                      </div>
                    </div>

                    <div className="images-section">
                      <div className="img-preview-wrap">
                        <img src={result.annotated_image_url} alt="Annotated" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        <span className="img-compare-badge">AI ANNOTATED</span>
                      </div>
                    </div>

                    {result.defects && result.defects.length > 0 && (
                      <div className="defects-section">
                        <div className="section-title">
                          Detected Defects
                          <span style={{fontFamily:'Geist Mono',fontWeight:600,color:'var(--red)',fontSize:'12px'}}>{result.defects.length} found</span>
                        </div>
                        {result.defects.map((defect, idx) => (
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
                    )}

                    <div className="address-section">
                      <div className="section-title" style={{marginBottom:'10px'}}>Location Logged</div>
                      <div className="address-row">
                        <div className="address-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'18px',height:'18px',color:'var(--teal)'}}>
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>
                        <div>
                          <div className="address-text">{result.address}</div>
                          <div className="address-coords">{result.lat.toFixed(4)}°N  {result.lng.toFixed(4)}°E</div>
                        </div>
                      </div>
                    </div>

                    <div className="result-actions">
                      <button className="btn btn-ghost" onClick={resetPage}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1 4 1 10 7 10"/>
                          <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
                        </svg>
                        New
                      </button>
                      <button className="btn btn-teal" style={{flex:2}}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"/>
                          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        View on Heatmap →
                      </button>
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
