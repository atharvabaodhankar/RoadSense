import { useEffect, useRef } from 'react';

export default function LocationMap({ lat, lng, onLocationChange, editable = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;

    // Load Google Maps script if not already loaded
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!window.google || !mapRef.current) return;

      const position = { lat, lng };

      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        center: position,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Create marker
      const marker = new window.google.maps.Marker({
        position,
        map,
        draggable: editable,
        animation: window.google.maps.Animation.DROP,
      });

      markerRef.current = marker;

      // Handle marker drag
      if (editable && onLocationChange) {
        marker.addListener('dragend', (event) => {
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          onLocationChange(newLat, newLng);
        });

        // Handle map click
        map.addListener('click', (event) => {
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          marker.setPosition({ lat: newLat, lng: newLng });
          onLocationChange(newLat, newLng);
        });
      }
    }
  }, [lat, lng, editable, onLocationChange]);

  // Update marker position when lat/lng changes
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      const newPosition = { lat, lng };
      markerRef.current.setPosition(newPosition);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newPosition);
      }
    }
  }, [lat, lng]);

  return (
    <div 
      ref={mapRef} 
      style={{
        width: '100%',
        height: '320px',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}
    />
  );
}
