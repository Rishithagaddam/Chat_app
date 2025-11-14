import api from '../api';
import notificationService from './notificationService';

class ActivityService {
  constructor() {
    this.activities = [];
    this.lastSeenTimes = new Map();
    this.userStatuses = new Map();
    this.socket = null;
    this.init();
  }

  init() {
    // Load cached activities
    const cached = localStorage.getItem('recentActivities');
    if (cached) {
      this.activities = JSON.parse(cached);
    }

    // Update user status periodically
    this.startStatusUpdater();
    
    // Track page visibility for accurate last seen
    this.trackPageVisibility();

    // Setup socket listeners when available
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    // Check for socket periodically since it might not be available immediately
    const checkSocket = () => {
      if (window.socket && window.socket !== this.socket) {
        this.socket = window.socket;
        this.attachSocketEvents();
      }
    };

    // Check immediately and then periodically
    checkSocket();
    setInterval(checkSocket, 1000);
  }

  attachSocketEvents() {
    if (!this.socket) return;

    console.log('🔔 ActivityService: Attaching socket events');

    // Remove existing listeners to prevent duplicates
    this.socket.off('receiveMessage');
    this.socket.off('receiveGroupMessage');
    this.socket.off('contactRequest');
    this.socket.off('contactAccepted');
    this.socket.off('userOnline');
    this.socket.off('userOffline');

    // Listen for incoming messages
    this.socket.on('receiveMessage', (data) => {
      console.log('🔔 ActivityService: Received message event', data);
      const msg = data.message || data;
      if (msg && msg.sender) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const senderId = String(msg.sender._id || msg.sender.id);
        const currentUserId = String(currentUser._id || currentUser.id);
        
        // Only log if message is not from current user
        if (senderId !== currentUserId) {
          this.messageReceived(
            senderId,
            msg.sender.name || 'Unknown User',
            msg.receiver?._id || msg.receiver,
            false
          );
          
          // Show browser notification
          notificationService.newMessage(
            msg.sender.name || 'Unknown User',
            { text: msg.message || 'Sent a file', _id: msg._id },
            msg.receiver?._id || msg.receiver,
            false
          );
        }
      }
    });

    // Listen for group messages
    this.socket.on('receiveGroupMessage', (data) => {
      console.log('🔔 ActivityService: Received group message event', data);
      if (data.message && data.message.sender) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const senderId = String(data.message.sender._id || data.message.sender.id);
        const currentUserId = String(currentUser._id || currentUser.id);
        
        // Only log if message is not from current user
        if (senderId !== currentUserId) {
          this.messageReceived(
            senderId,
            data.message.sender.name || 'Unknown User',
            data.groupId,
            true
          );
          
          // Show browser notification
          notificationService.newMessage(
            data.message.sender.name || 'Unknown User',
            { text: data.message.message || 'Sent a file', _id: data.message._id },
            data.groupId,
            true
          );
        }
      }
    });

    // Listen for contact requests
    this.socket.on('contactRequest', (data) => {
      console.log('🔔 ActivityService: Received contact request event', data);
      if (data.from) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = String(currentUser._id || currentUser.id);
        
        // Only log if request is for current user
        if (String(data.toUserId) === currentUserId) {
          this.contactRequestReceived(
            data.from.id || data.from._id,
            data.from.name || 'Unknown User'
          );
          
          // Show browser notification
          notificationService.showNotification(
            'New Contact Request',
            {
              body: `${data.from.name} wants to connect with you`,
              data: { type: 'contact_request', fromId: data.from.id }
            },
            data.from.id,
            'message'
          );
        }
      }
    });

    // Listen for accepted contacts
    this.socket.on('contactAccepted', (data) => {
      console.log('🔔 ActivityService: Contact accepted event', data);
      if (data.user) {
        this.contactRequestAccepted(
          data.user.id || data.user._id,
          data.user.name || 'Unknown User'
        );
        
        // Show browser notification
        notificationService.showNotification(
          'Contact Request Accepted',
          {
            body: `${data.user.name} accepted your contact request`,
            data: { type: 'contact_accepted', userId: data.user.id }
          },
          data.user.id,
          'message'
        );
      }
    });

    // Listen for user status changes
    this.socket.on('userOnline', (data) => {
      if (data.user) {
        this.updateLastSeen(data.user.id, new Date());
        this.userStatuses.set(data.user.id, 'online');
      }
    });

    this.socket.on('userOffline', (data) => {
      if (data.user) {
        this.updateLastSeen(data.user.id, new Date(data.lastSeen || Date.now()));
        this.userStatuses.set(data.user.id, 'offline');
      }
    });
  }

  startStatusUpdater() {
    // User status is now handled by socket connection, not by periodic API calls
    // No need to update status via API since socket.io handles this automatically
  }

  trackPageVisibility() {
    // Track page visibility but don't make API calls
    // Socket connection handles online/offline status automatically
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('Page hidden - socket will handle status');
      } else {
        console.log('Page visible - socket will handle status');
      }
    });

    // Handle page unload - socket disconnect will handle this
    window.addEventListener('beforeunload', () => {
      console.log('Page unloading - socket disconnect will handle status');
    });
  }

  logActivity(type, data) {
    const activity = {
      id: Date.now().toString(),
      type,
      timestamp: new Date(),
      data,
      read: false
    };

    this.activities.unshift(activity);
    
    // Keep only last 100 activities
    if (this.activities.length > 100) {
      this.activities = this.activities.slice(0, 100);
    }

    this.saveActivities();
    this.notifyActivityListeners(activity);
    
    console.log('🔔 ActivityService: New activity logged', activity);
  }

  saveActivities() {
    localStorage.setItem('recentActivities', JSON.stringify(this.activities));
  }

  notifyActivityListeners(activity) {
    window.dispatchEvent(new CustomEvent('newActivity', { detail: activity }));
  }

  // Activity logging methods
  messageReceived(senderId, senderName, chatId, isGroup = false) {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    // Don't log our own messages
    if (currentUser && String(senderId) === String(currentUser._id || currentUser.id)) {
      return;
    }

    this.logActivity('message_received', {
      senderId,
      senderName,
      chatId,
      isGroup,
      timestamp: new Date()
    });
  }

  contactRequestReceived(fromUserId, fromUserName) {
    this.logActivity('contact_request_received', {
      fromUserId,
      fromUserName,
      timestamp: new Date()
    });
  }

  contactRequestAccepted(userId, userName) {
    this.logActivity('contact_accepted', {
      userId,
      userName,
      timestamp: new Date()
    });
  }

  mediaShared(senderId, senderName, chatId, mediaType, fileName) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    // Don't log our own media
    if (currentUser && String(senderId) === String(currentUser._id || currentUser.id)) {
      return;
    }

    this.logActivity('media_shared', {
      senderId,
      senderName,
      chatId,
      mediaType,
      fileName,
      timestamp: new Date()
    });
  }

  updateLastSeen(userId, timestamp = new Date()) {
    this.lastSeenTimes.set(userId, timestamp);
  }

  getLastSeen(userId) {
    return this.lastSeenTimes.get(userId);
  }

  formatLastSeen(timestamp) {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const diff = now - new Date(timestamp);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }

  getActivities(limit = 50) {
    return this.activities.slice(0, limit);
  }

  markActivityAsRead(activityId) {
    const activity = this.activities.find(a => a.id === activityId);
    if (activity) {
      activity.read = true;
      this.saveActivities();
    }
  }

  markAllActivitiesAsRead() {
    this.activities.forEach(activity => {
      activity.read = true;
    });
    this.saveActivities();
  }

  getUnreadActivitiesCount() {
    return this.activities.filter(a => !a.read).length;
  }

  clearActivities() {
    this.activities = [];
    this.saveActivities();
  }
}

export default new ActivityService();
