import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';
import api from '../lib/api';

export default function MapPage({ userRole }) {
  const [user, setUser] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    loadHeatmapData();
  }, []);

  const loadHeatmapData = async () => {
    try {
      const response = await api.get('/heatmap');
      setInspections(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && inspections.length > 0 && !mapRef.current) {
      // Wait for Google Maps to load before initializing
      if (!window.google) {
        const checkGoogle = setInterval(() => {
          if (window.google) {
            clearInterval(checkGoogle);
            initMap();
          }
        }, 100);
      } else {
        initMap();
      }
    }
  }, [loading, inspections]);

  const initMap = async () => {
    const center = inspections.length > 0 
      ? { lat: inspections[0].lat, lng: inspections[0].lng }
      : { lat: 18.5204, lng: 73.8567 }; // Pune default

    // Import maps library
    const { Map } = await google.maps.importLibrary("maps");
    
    // Create map with mapId (required for advanced markers)
    const map = new Map(document.getElementById('map'), {
      zoom: 12,
      center,
      mapId: 'ROADSENSE_MAP',
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
      },
      streetViewControl: true,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      },
      fullscreenControl: true,
      fullscreenControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      },
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      }
    });

    mapRef.current = map;

    // Import marker library
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    // Add advanced markers for each inspection
    inspections.forEach(inspection => {
      const pinColor = inspection.status === 'Critical' ? '#dc2626' : 
                       inspection.status === 'Moderate' ? '#d97706' : '#16a34a';
      
      const marker = new AdvancedMarkerElement({
        map,
        position: { lat: inspection.lat, lng: inspection.lng },
        title: inspection.address || 'Inspection'
      });

      // Apply custom pin styling
      const pinElement = marker.content;
      pinElement.background = pinColor;
      pinElement.borderColor = '#fff';
      pinElement.glyphColor = '#fff';
      pinElement.scale = 1.2;

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="font-family:Geist,sans-serif;padding:8px;min-width:200px;">
            <div style="font-weight:600;margin-bottom:6px;">${inspection.address || 'Unknown location'}</div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-family:Geist Mono,monospace;font-size:20px;font-weight:700;color:${pinColor}">${inspection.score}</span>
              <span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:500;background:${
                inspection.status === 'Critical' ? '#fef2f2' : 
                inspection.status === 'Moderate' ? '#fefce8' : '#f0fdf4'
              };color:${pinColor}">${inspection.status}</span>
            </div>
            <div style="font-size:11px;color:#8F8F8B;font-family:Geist Mono,monospace;">
              ${new Date(inspection.created_at).toLocaleDateString()}
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Realtime listener
    const channel = supabase
      .channel('inspections')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'inspections' },
        (payload) => {
          const newInspection = payload.new;
          addHeatmapPoint(newInspection);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const addHeatmapPoint = async (inspection) => {
    if (!mapRef.current) return;

    // Import marker library
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    const pinColor = inspection.status === 'Critical' ? '#dc2626' : 
                     inspection.status === 'Moderate' ? '#d97706' : '#16a34a';
    
    const marker = new AdvancedMarkerElement({
      map: mapRef.current,
      position: { lat: inspection.lat, lng: inspection.lng },
      title: inspection.address || 'Inspection'
    });

    // Apply custom pin styling
    const pinElement = marker.content;
    pinElement.background = pinColor;
    pinElement.borderColor = '#fff';
    pinElement.glyphColor = '#fff';
    pinElement.scale = 1.2;

    markersRef.current.push(marker);
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
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="topbar-breadcrumb">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--text-tertiary)'}}>
              <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            <span>City Map</span>
          </div>
          <div className="topbar-actions">
            <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
              <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'var(--green)'}} className="pulse-dot"></span>
              <span style={{fontSize:'11.5px',color:'var(--green)',fontWeight:500,fontFamily:'Geist Mono, monospace'}}>Live</span>
            </div>
          </div>
        </header>

        <div className="page" style={{padding:0,height:'calc(100vh - 60px)'}}>
          {loading ? (
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}>
              <div className="spinner" style={{width:'32px',height:'32px'}}></div>
            </div>
          ) : (
            <div id="map" style={{width:'100%',height:'100%'}}></div>
          )}
        </div>
      </main>
    </div>
  );
}
