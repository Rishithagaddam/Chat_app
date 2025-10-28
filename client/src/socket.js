import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io('http://localhost:5000', {
    auth: {
      token: token
    },
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000
  });

  socket.on('connect', () => {
    console.log('✅ Connected to server');
    startActivityTracking();
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from server:', reason);
    stopActivityTracking();
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection failed:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    stopActivityTracking();
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Activity tracking to maintain online status
let activityInterval = null;
let activityCleanup = null;
let lastActivityTime = Date.now();

const trackActivity = () => {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const updateActivity = () => {
    lastActivityTime = Date.now();
  };

  events.forEach(event => {
    document.addEventListener(event, updateActivity, true);
  });

  return () => {
    events.forEach(event => {
      document.removeEventListener(event, updateActivity, true);
    });
  };
};

const startActivityTracking = () => {
  if (activityInterval) return;

  activityCleanup = trackActivity();
  
  // Send activity ping every 30 seconds if user is active
  activityInterval = setInterval(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime;
    
    // Only send activity if user was active in the last 2 minutes
    if (timeSinceLastActivity < 2 * 60 * 1000 && socket && socket.connected) {
      socket.emit('userActivity');
    }
  }, 30000);
};

const stopActivityTracking = () => {
  if (activityInterval) {
    clearInterval(activityInterval);
    activityInterval = null;
  }
  
  if (activityCleanup) {
    activityCleanup();
    activityCleanup = null;
  }
};

// Send initial activity on page load
document.addEventListener('DOMContentLoaded', () => {
  lastActivityTime = Date.now();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    lastActivityTime = Date.now();
    if (socket && socket.connected) {
      socket.emit('userActivity');
    }
  }
});