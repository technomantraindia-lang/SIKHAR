import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2, ChevronDown } from '../common/Icons';

// GPS Fleet Telemetry Dataset (Delhi NCR Hub coordinates)
// Prepared as standard GeoJSON structure ready to be plugged into real GPS API
const FLEET_GPS_TELEMETRY = [
  {
    id: 'veh-01',
    reg: 'HR38AK1234',
    driver: 'Amit Singh',
    phone: '+91 98101 67890',
    model: 'Tigor EV Fleet',
    type: 'EV',
    status: 'On Road',
    category: 'on_road',
    lat: 28.4950,
    lng: 77.0895,
    location: 'Gurgaon Cyber City • Phase 2',
    speed: '68 km/h',
    updated: '2 min ago',
    battery: '82%',
    route: [
      [28.4720, 77.0420],
      [28.4810, 77.0600],
      [28.4950, 77.0895]
    ]
  },
  {
    id: 'veh-02',
    reg: 'DL52GD6605',
    driver: 'Raj Kumar',
    phone: '+91 98101 23456',
    model: 'WagonR H3 CNG',
    type: 'CNG',
    status: 'At Workshop',
    category: 'workshop',
    lat: 28.4720,
    lng: 77.0420,
    location: 'ABC Motors Workshop • Sector 14, Gurgaon',
    speed: '0 km/h (In Bay)',
    updated: 'Job Card #JC-0125 Active',
    battery: 'CNG Tank Full'
  },
  {
    id: 'veh-03',
    reg: 'UP16HT7788',
    driver: 'Vikram Singh',
    phone: '+91 98101 44556',
    model: 'Tigor EV Fleet',
    type: 'EV',
    status: 'On Road',
    category: 'on_road',
    lat: 28.6280,
    lng: 77.3650,
    location: 'Sector 62, Noida Electronic City',
    speed: '54 km/h',
    updated: '1 min ago',
    battery: '64%',
    route: [
      [28.5700, 77.3200],
      [28.6050, 77.3500],
      [28.6280, 77.3650]
    ]
  },
  {
    id: 'veh-04',
    reg: 'DL1Z08899',
    driver: 'Suraj Mishra',
    phone: '+91 98101 99112',
    model: 'Tigor EV Fleet',
    type: 'EV',
    status: 'On Road',
    category: 'on_road',
    lat: 28.6315,
    lng: 77.2167,
    location: 'Connaught Place Inner Circle, New Delhi',
    speed: '42 km/h',
    updated: 'Just now',
    battery: '88%'
  },
  {
    id: 'veh-05',
    reg: 'DL52GD6534',
    driver: 'Vicky',
    phone: '+91 98101 33221',
    model: 'WagonR H3 CNG',
    type: 'CNG',
    status: 'On Road',
    category: 'on_road',
    lat: 28.5494,
    lng: 77.2528,
    location: 'Nehru Place Outer Ring Road, New Delhi',
    speed: '61 km/h',
    updated: '3 min ago',
    battery: 'CNG 85%'
  },
  {
    id: 'veh-06',
    reg: 'HR55BC2211',
    driver: 'Rohit Yadav',
    phone: '+91 98101 99887',
    model: 'WagonR H3 CNG',
    type: 'CNG',
    status: 'Ready',
    category: 'ready',
    lat: 28.4480,
    lng: 77.0400,
    location: 'Sikhar Central Terminal Yard, Sec 32, Gurgaon',
    speed: '0 km/h (Standby)',
    updated: 'Ready to Deploy',
    battery: '100% Inspected'
  },
  {
    id: 'veh-07',
    reg: 'DL52GD7393',
    driver: 'Sandeep Kumar',
    phone: '+91 98101 11223',
    model: 'WagonR H3 CNG',
    type: 'CNG',
    status: 'Breakdown',
    category: 'breakdown',
    lat: 28.4520,
    lng: 77.0700,
    location: 'Sector 44 Roadside, Gurgaon',
    speed: '0 km/h (Stopped)',
    updated: 'Recovery Dispatched',
    battery: 'Engine Overheat'
  },
  {
    id: 'veh-08',
    reg: 'HR38AK5678',
    driver: 'Manoj Yadav',
    phone: '+91 98101 23456',
    model: 'WagonR H3 CNG',
    type: 'CNG',
    status: 'At Workshop',
    category: 'workshop',
    lat: 28.4890,
    lng: 77.0720,
    location: 'Maruti Authorized Service, Gurgaon',
    speed: '0 km/h (Bay 4)',
    updated: 'Clutch Assembly Repair',
    battery: 'CNG 90%'
  },
  {
    id: 'veh-09',
    reg: 'DL8CAZ7788',
    driver: 'Standby Driver',
    phone: '+91 98101 55667',
    model: 'WagonR H3 CNG',
    type: 'CNG',
    status: 'Ready',
    category: 'ready',
    lat: 28.7180,
    lng: 77.1180,
    location: 'North Delhi Sub-Hub • Rohini Sector 10',
    speed: '0 km/h (Standby)',
    updated: 'Pre-QC Cleared',
    battery: '100% Inspected'
  }
];

export default function FleetLiveLocationMap({ onSelectVehicle }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(FLEET_GPS_TELEMETRY[0]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if map already initialized
    if (!mapInstanceRef.current) {
      // Center on Delhi NCR (Latitude 28.55, Longitude 77.15)
      const map = L.map(mapContainerRef.current, {
        center: [28.55, 77.18],
        zoom: 11,
        zoomControl: false,
        attributionControl: false
      });

      // OpenStreetMap high-detail tiles (Free, No API Key required, No watermarks)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear previous markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    // Filter telemetry
    const filtered = activeCategory === 'all'
      ? FLEET_GPS_TELEMETRY
      : FLEET_GPS_TELEMETRY.filter(v => v.category === activeCategory);

    // Plot Markers with genuine Location Pin symbols (📍)
    filtered.forEach(v => {
      const isSelected = selectedAsset && selectedAsset.id === v.id;
      const color =
        v.category === 'on_road' ? '#10b981' :
        v.category === 'workshop' ? '#f59e0b' :
        v.category === 'breakdown' ? '#ef4444' : '#2563eb';

      const iconHtml = `
        <div class="fleet-location-pin-wrap ${v.category} ${isSelected ? 'is-selected-pin' : ''}">
          <div class="pin-pulse-wave" style="background: ${color}"></div>
          <div class="pin-reg-tag" title="Vehicle Registration Plate: ${v.reg}">${v.reg.slice(-4)}</div>
          <svg class="location-pin-svg" width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="17" cy="42" rx="7" ry="2" fill="rgba(15, 23, 42, 0.35)"/>
            <path d="M17 1C8.163 1 1 8.163 1 17C1 28 17 42 17 42C17 42 33 28 33 17C33 8.163 25.837 1 17 1Z" fill="${color}" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
            <circle cx="17" cy="16" r="8" fill="#FFFFFF"/>
            <circle cx="17" cy="16" r="4" fill="${color}"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'fleet-leaflet-div-icon',
        html: iconHtml,
        iconSize: [34, 44],
        iconAnchor: [17, 42]
      });

      const marker = L.marker([v.lat, v.lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setSelectedAsset(v);
        map.panTo([v.lat, v.lng], { animate: true, duration: 0.6 });
      });

      markersRef.current.push(marker);
    });

    // Draw breadcrumb route line for selected asset if available
    if (selectedAsset && selectedAsset.route) {
      polylineRef.current = L.polyline(selectedAsset.route, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 8',
        lineCap: 'round'
      }).addTo(map);
    }

    return () => {
      // cleanup on unmount
    };
  }, [activeCategory, selectedAsset]);

  // Handle Zoom
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };
  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Counts for legend
  const onRoadCount = FLEET_GPS_TELEMETRY.filter(v => v.category === 'on_road').length;
  const workshopCount = FLEET_GPS_TELEMETRY.filter(v => v.category === 'workshop').length;
  const breakdownCount = FLEET_GPS_TELEMETRY.filter(v => v.category === 'breakdown').length;
  const readyCount = FLEET_GPS_TELEMETRY.filter(v => v.category === 'ready').length;

  return (
    <div className={`fleet-live-map-card ${isExpanded ? 'is-map-expanded' : ''}`}>
      {/* Header matching user reference */}
      <div className="live-map-header">
        <div className="live-map-header-left">
          <div className="live-map-green-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div className="live-map-title-wrap">
            <h3 className="live-map-heading">Fleet Live Location</h3>
            <span className="live-map-subline">Real-time GPS telemetry from connected on-board IoT devices</span>
          </div>
        </div>

        <div className="live-map-header-right">
          <button 
            className="btn-view-full-map"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span>{isExpanded ? 'Collapse Map' : 'View Full Map'}</span>
            <ChevronDown size={14} className={isExpanded ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>

      {/* Map Canvas Viewport */}
      <div className="live-map-viewport-wrapper">
        <div ref={mapContainerRef} className="leaflet-map-canvas" />

        {/* Top-Left Live Telemetry Badge */}
        <div className="map-floating-live-badge">
          <span className="live-pulsing-green-dot"></span>
          <span>Live GPS</span>
        </div>

        {/* Top-Right Fullscreen Toggle */}
        <button 
          className="map-floating-expand-btn"
          onClick={() => setIsExpanded(!isExpanded)}
          title="Toggle Fullscreen Map"
        >
          {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {/* Bottom-Right Leaflet Zoom Controls */}
        <div className="map-custom-zoom-controls">
          <button onClick={handleZoomIn} title="Zoom In">+</button>
          <button onClick={handleZoomOut} title="Zoom Out">−</button>
        </div>

        {/* Floating Dark Tooltip Card Matching Screenshot Exactly */}
        {selectedAsset && (
          <div className="map-floating-asset-tooltip">
            <div className="tooltip-top-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong className="tooltip-reg-num">{selectedAsset.reg}</strong>
                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px', color: '#93c5fd', fontFamily: 'monospace' }}>
                  #{selectedAsset.reg.slice(-4)}
                </span>
              </div>
              <ChevronDown size={14} className="text-muted ml-auto mr-1" />
            </div>

            <div className="tooltip-status-row">
              <span className={`tooltip-status-badge ${selectedAsset.category}`}>
                <span className="bullet"></span>
                <span>{selectedAsset.status}</span>
              </span>
            </div>

            <div className="tooltip-driver-name">{selectedAsset.driver}</div>
            <div className="tooltip-location-text">{selectedAsset.location}</div>

            <div className="tooltip-telemetry-bottom">
              <span className="telemetry-speed">{selectedAsset.speed}</span>
              <span className="telemetry-dot">•</span>
              <span className="telemetry-time">{selectedAsset.updated}</span>
            </div>

            {onSelectVehicle && (
              <button
                type="button"
                className="btn-map-view-driver-profile"
                onClick={() => onSelectVehicle(selectedAsset)}
              >
                <span>View Full Driver Profile</span>
                <span className="arrow">→</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Filter & Status Legend Pills Matching Screenshot Exactly */}
      <div className="live-map-bottom-legend-bar">
        <button
          className={`map-legend-pill green ${activeCategory === 'on_road' ? 'is-active' : ''}`}
          onClick={() => setActiveCategory(activeCategory === 'on_road' ? 'all' : 'on_road')}
        >
          <span className="legend-indicator-dot bg-green"></span>
          <span>On Road ({onRoadCount})</span>
        </button>

        <button
          className={`map-legend-pill orange ${activeCategory === 'workshop' ? 'is-active' : ''}`}
          onClick={() => setActiveCategory(activeCategory === 'workshop' ? 'all' : 'workshop')}
        >
          <span className="legend-star-icon text-orange">★</span>
          <span>At Workshop ({workshopCount})</span>
        </button>

        <button
          className={`map-legend-pill red ${activeCategory === 'breakdown' ? 'is-active' : ''}`}
          onClick={() => setActiveCategory(activeCategory === 'breakdown' ? 'all' : 'breakdown')}
        >
          <span className="legend-indicator-dot bg-red"></span>
          <span>Breakdown ({breakdownCount})</span>
        </button>

        <button
          className={`map-legend-pill blue ${activeCategory === 'ready' ? 'is-active' : ''}`}
          onClick={() => setActiveCategory(activeCategory === 'ready' ? 'all' : 'ready')}
        >
          <span className="legend-indicator-dot bg-blue"></span>
          <span>Ready ({readyCount})</span>
        </button>

        {activeCategory !== 'all' && (
          <button className="map-legend-reset-btn" onClick={() => setActiveCategory('all')}>
            Show All ({FLEET_GPS_TELEMETRY.length})
          </button>
        )}
      </div>
    </div>
  );
}
