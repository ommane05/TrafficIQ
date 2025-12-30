/**
 * TrafficIQ Frontend Configuration
 * Centralized configuration loaded from environment variables
 */

// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Ensure no trailing slash
export const API_BASE_URL = API_URL.replace(/\/$/, '');

// WebSocket URL (same as API URL for Socket.IO)
export const SOCKET_URL = API_BASE_URL;

// API Endpoints
export const ENDPOINTS = {
    UPLOAD: `${API_BASE_URL}/upload`,
    TRAFFIC_DATA: `${API_BASE_URL}/process_traffic`,
    HEALTH: `${API_BASE_URL}/health`,
};

// Socket.IO Configuration
export const SOCKET_OPTIONS = {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'],
};

// Traffic Directions
export const DIRECTIONS = ['north', 'east', 'south', 'west'];

// Direction Configuration
export const DIRECTION_CONFIG = {
    north: { icon: '↑', color: 'cyan', label: 'North' },
    east: { icon: '→', color: 'violet', label: 'East' },
    south: { icon: '↓', color: 'emerald', label: 'South' },
    west: { icon: '←', color: 'amber', label: 'West' },
};
