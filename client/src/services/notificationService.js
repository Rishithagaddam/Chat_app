class NotificationService {
  constructor() {
    this.permission = Notification.permission;
    this.preferences = this.loadPreferences();
    this.doNotDisturbUntil = null;
    this.mutedChats = new Set();
  }

  init() {
    // Request notification permission if not granted
    if (this.permission === 'default') {
      this.requestPermission();
    }
    
    // Load muted chats and DND settings
    const dndUntil = localStorage.getItem('dndUntil');
    if (dndUntil) {
      const dndTime = new Date(dndUntil);
      if (dndTime > new Date()) {
        this.doNotDisturbUntil = dndTime;
      } else {
        localStorage.removeItem('dndUntil');
      }
    }

    const mutedChats = localStorage.getItem('mutedChats');
    if (mutedChats) {
      try {
        this.mutedChats = new Set(JSON.parse(mutedChats));
      } catch (e) {
        this.mutedChats = new Set();
      }
    }

    console.log('🔔 NotificationService initialized', {
      permission: this.permission,
      preferences: this.preferences,
      isDND: this.isDoNotDisturb()
    });
  }

  loadPreferences() {
    const saved = localStorage.getItem('notificationPreferences');
    return saved ? JSON.parse(saved) : {
      browserNotifications: true,
      emailNotifications: true,
      soundEnabled: true,
      showPreview: true,
      messageNotifications: true,
      groupNotifications: true,
      mediaNotifications: true
    };
  }

  savePreferences() {
    localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
  }

  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission === 'granted';
    }
    return false;
  }

  isDoNotDisturb() {
    if (!this.doNotDisturbUntil) return false;
    
    if (new Date() > this.doNotDisturbUntil) {
      this.doNotDisturbUntil = null;
      localStorage.removeItem('dndUntil');
      return false;
    }
    
    return true;
  }

  isChatMuted(chatId) {
    return this.mutedChats.has(chatId);
  }

  setDoNotDisturb(minutes) {
    if (minutes === 0) {
      this.doNotDisturbUntil = null;
      localStorage.removeItem('dndUntil');
    } else {
      this.doNotDisturbUntil = new Date(Date.now() + minutes * 60 * 1000);
      localStorage.setItem('dndUntil', this.doNotDisturbUntil.toISOString());
    }
  }

  muteChat(chatId, duration = null) {
    this.mutedChats.add(chatId);
    localStorage.setItem('mutedChats', JSON.stringify([...this.mutedChats]));
    
    if (duration) {
      setTimeout(() => {
        this.unmuteChat(chatId);
      }, duration);
    }
  }

  unmuteChat(chatId) {
    this.mutedChats.delete(chatId);
    localStorage.setItem('mutedChats', JSON.stringify([...this.mutedChats]));
  }

  shouldShowNotification(type, chatId) {
    if (this.isDoNotDisturb()) return false;
    if (this.isChatMuted(chatId)) return false;
    if (!this.preferences.browserNotifications) return false;
    
    switch (type) {
      case 'message':
        return this.preferences.messageNotifications;
      case 'group':
        return this.preferences.groupNotifications;
      case 'media':
        return this.preferences.mediaNotifications;
      default:
        return true;
    }
  }

  showNotification(title, options = {}, chatId = null, type = 'message') {
    if (!this.shouldShowNotification(type, chatId)) return;
    if (this.permission !== 'granted') return;

    const notificationOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: chatId || 'general',
      ...options
    };

    if (!this.preferences.showPreview && options.body) {
      notificationOptions.body = 'New message';
    }

    const notification = new Notification(title, notificationOptions);
    
    // Play sound if enabled
    if (this.preferences.soundEnabled) {
      this.playNotificationSound();
    }

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    return notification;
  }

  playNotificationSound() {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore errors if sound can't be played
      });
    } catch (error) {
      // Ignore sound errors
    }
  }

  updatePreferences(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
  }

  // Notification methods for different events
  newMessage(senderName, message, chatId, isGroup = false) {
    console.log('🔔 NotificationService: New message notification', {
      senderName, 
      message: message.text || 'media',
      chatId, 
      isGroup,
      shouldShow: this.shouldShowNotification(isGroup ? 'group' : 'message', chatId)
    });
    
    const type = isGroup ? 'group' : 'message';
    const title = isGroup ? `${senderName} in group` : senderName;
    
    this.showNotification(title, {
      body: message.text || 'Sent a file',
      data: { chatId, messageId: message._id },
      icon: '/favicon.ico'
    }, chatId, type);
  }

  mediaShared(senderName, mediaType, chatId, isGroup = false) {
    console.log('🔔 NotificationService: Media shared notification', {
      senderName, 
      mediaType, 
      chatId, 
      isGroup
    });
    
    const title = isGroup ? `${senderName} in group` : senderName;
    const mediaTypeText = {
      image: 'photo',
      video: 'video',
      audio: 'audio file',
      file: 'file'
    };
    
    this.showNotification(title, {
      body: `Shared a ${mediaTypeText[mediaType] || 'file'}`,
      data: { chatId, type: 'media' },
      icon: '/favicon.ico'
    }, chatId, 'media');
  }

  userJoinedGroup(userName, groupName, groupId) {
    this.showNotification('Group Update', {
      body: `${userName} joined ${groupName}`,
      data: { chatId: groupId, type: 'group-join' }
    }, groupId, 'group');
  }

  userLeftGroup(userName, groupName, groupId) {
    this.showNotification('Group Update', {
      body: `${userName} left ${groupName}`,
      data: { chatId: groupId, type: 'group-leave' }
    }, groupId, 'group');
  }
}

export default new NotificationService();
