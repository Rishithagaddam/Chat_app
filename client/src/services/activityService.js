import api from '../api';

class ActivityService {
  constructor() {
    this.activities = [];
    this.lastSeenTimes = new Map();
    this.userStatuses = new Map();
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

    // Listen for real-time events to create dynamic notifications
    this.setupRealtimeListeners();
  }

  startStatusUpdater() {
    // Update status every 30 seconds
    setInterval(() => {
      this.updateUserStatus('online');
    }, 30000);

    // Initial status update
    this.updateUserStatus('online');
  }

  trackPageVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.updateUserStatus('away');
      } else {
        this.updateUserStatus('online');
      }
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.updateUserStatus('offline');
    });
  }

  async updateUserStatus(status) {
    try {
      await api.post('/user/status', { status, timestamp: new Date() });
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
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
  }

  saveActivities() {
    localStorage.setItem('recentActivities', JSON.stringify(this.activities));
  }

  notifyActivityListeners(activity) {
    window.dispatchEvent(new CustomEvent('newActivity', { detail: activity }));
  }

  setupRealtimeListeners() {
    // Listen for socket events if available
    if (window.socket) {
      window.socket.on('receiveMessage', (data) => {
        const msg = data.message || data;
        if (msg && msg.sender) {
          this.messageReceived(
            msg.sender._id,
            msg.sender.name,
            msg.receiver?._id || msg.group,
            !!msg.group
          );
        }
      });

      window.socket.on('receiveGroupMessage', (data) => {
        if (data.message && data.message.sender) {
          this.messageReceived(
            data.message.sender._id,
            data.message.sender.name,
            data.groupId,
            true
          );
        }
      });

      window.socket.on('contactRequest', (data) => {
        if (data.from) {
          this.logActivity('contact_request_received', {
            fromUserId: data.from.id,
            fromUserName: data.from.name,
            timestamp: new Date()
          });
        }
      });

      window.socket.on('contactAccepted', (data) => {
        if (data.user) {
          this.logActivity('contact_accepted', {
            userId: data.user.id,
            userName: data.user.name,
            timestamp: new Date()
          });
        }
      });
    }

    // Listen for media upload events
    window.addEventListener('refreshGroupMedia', (event) => {
      if (event.detail.mediaType && event.detail.userName) {
        this.mediaShared(
          event.detail.userId,
          event.detail.userName,
          event.detail.groupId,
          event.detail.mediaType,
          event.detail.fileName
        );
      }
    });
  }

  // Activity logging methods
  messageReceived(senderId, senderName, chatId, isGroup = false) {
    const currentUser = JSON.parse(localStorage.getItem('user'));
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
