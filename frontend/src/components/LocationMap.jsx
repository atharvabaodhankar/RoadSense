import { useEffect, useRef } from 'react';

export default function LocationMap({ lat, lng, onLocationChange, editable = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;

    initMap();

    async function initMap() {
      // Wait for Google Maps to load
      if (!window.google) {
        await new Promise((resolve) => {
          const checkGoogle = setInterval(() => {
            if (window.google) {
              clearInterval(checkGoogle);
              resolve();
            }
          }, 100);
        });
      }

      if (!window.google || !mapRef.current) return;

      const position = { lat, lng };

      // Import maps library
      const { Map } = await window.google.maps.importLibrary("maps");

      // Create map with mapId for advanced markers
      const map = new Map(mapRef.current, {
        center: position,
        zoom: 16,
        mapId: 'ROADSENSE_LOCATION_MAP',
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: google.maps.ControlPosition.TOP_RIGHT,
          mapTypeIds: ['roadmap', 'satellite', 'hybrid']
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

      mapInstanceRef.current = map;

      // Import marker library
      const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker");

      // Create advanced marker with PinElement
      const marker = new AdvancedMarkerElement({
        map,
        position,
        gmpDraggable: editable,
        title: 'Inspection Location'
      });

      // Apply custom pin styling
      const pinElement = marker.content;
      pinElement.background = '#0d9488';
      pinElement.borderColor = '#fff';
      pinElement.glyphColor = '#fff';
      pinElement.scale = 1.2;

      markerRef.current = marker;

      // Handle marker drag
      if (editable && onLocationChange) {
        marker.addListener('dragend', (event) => {
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          onLocationChange(newLat, newLng);
        });

        // Handle map click
        map.addListener('click', async (event) => {
          const newLat = event.latLng.lat();
          const newLng = event.latLng.lng();
          
          // Update marker position
          marker.position = { lat: newLat, lng: newLng };
          onLocationChange(newLat, newLng);
        });
      }
    }
  }, [lat, lng, editable, onLocationChange]);

  // Update marker position when lat/lng changes
  useEffect(() => {
    if (markerRef.current && lat && lng) {
      const newPosition = { lat, lng };
      markerRef.current.position = newPosition;
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
