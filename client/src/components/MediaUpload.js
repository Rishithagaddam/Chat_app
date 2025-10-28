import React, { useState, useRef } from 'react';
import VoiceRecorder from './VoiceRecorder';

const MediaUpload = ({ onSend, disabled, receiverId, groupId }) => {
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // File size limits (in MB)
  const fileLimits = {
    image: 5,
    audio: 10,
    video: 50,
    file: 25
  };

  const validateFile = (file, type) => {
    const limit = fileLimits[type] * 1024 * 1024; // Convert to bytes
    
    if (file.size > limit) {
      alert(`File too large. Maximum size for ${type} is ${fileLimits[type]}MB`);
      return false;
    }
    
    return true;
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        let { width, height } = img;
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          // Create new file object
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.85);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = async (file, type, extraData = {}) => {
    if (!validateFile(file, type)) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      let processedFile = file;
      
      // Compress images before upload
      if (type === 'image' && file.type.startsWith('image/')) {
        processedFile = await compressImage(file);
        console.log(`📸 Image compressed: ${file.size} → ${processedFile.size} bytes`);
      }
      
      const formData = new FormData();
      formData.append('file', processedFile);
      
      if (receiverId) formData.append('receiverId', receiverId);
      if (groupId) formData.append('groupId', groupId);
      
      // Add extra data
      Object.keys(extraData).forEach(key => {
        formData.append(key, extraData[key]);
      });
      
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });
      
      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          console.log(`✅ ${type} uploaded successfully:`, response);
          
          if (onSend) {
            onSend(response.data.message);
          }
        } else {
          const error = JSON.parse(xhr.responseText);
          console.error(`❌ ${type} upload failed:`, error);
          alert(error.message || `Failed to upload ${type}`);
        }
        
        setIsUploading(false);
        setUploadProgress(0);
      });
      
      // Handle errors
      xhr.addEventListener('error', () => {
        console.error(`❌ ${type} upload failed`);
        alert(`Failed to upload ${type}`);
        setIsUploading(false);
        setUploadProgress(0);
      });
      
      // Start upload
      xhr.open('POST', `http://localhost:5000/api/media/upload/${type}`);
      
      // Add auth token
      const token = localStorage.getItem('token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);
      
    } catch (error) {
      console.error(`❌ ${type} upload error:`, error);
      alert(`Failed to upload ${type}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadFile(file, 'image');
    }
    event.target.value = ''; // Reset input
  };

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Get video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        uploadFile(file, 'video', { duration: video.duration });
      };
      
      video.src = URL.createObjectURL(file);
    }
    event.target.value = '';
  };

  const handleAudioUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Get audio duration
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        uploadFile(file, 'audio', { duration: audio.duration });
      };
      
      audio.src = URL.createObjectURL(file);
    }
    event.target.value = '';
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadFile(file, 'file');
    }
    event.target.value = '';
  };

  const handleVoiceSend = async (audioBlob, duration) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_message.webm');
      formData.append('duration', duration);
      
      if (receiverId) formData.append('receiverId', receiverId);
      if (groupId) formData.append('groupId', groupId);
      
      const response = await fetch('http://localhost:5000/api/media/upload/voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Voice message sent:', result);
        
        if (onSend) {
          onSend(result.data.message);
        }
        
        setShowVoiceRecorder(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to send voice message');
      }
      
    } catch (error) {
      console.error('❌ Voice message error:', error);
      alert('Failed to send voice message');
    } finally {
      setIsUploading(false);
    }
  };

  if (isUploading) {
    return (
      <div style={{
        padding: '16px',
        background: 'var(--white)',
        borderRadius: '12px',
        boxShadow: '0 4px 15px var(--shadow)',
        border: '2px solid var(--primary-light)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '12px', color: 'var(--primary-medium)', fontWeight: '600' }}>
          📤 Uploading... {Math.round(uploadProgress)}%
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          background: 'var(--accent-light)',
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${uploadProgress}%`,
            height: '100%',
            background: 'var(--gradient-primary)',
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>
    );
  }

  if (showVoiceRecorder) {
    return (
      <VoiceRecorder
        onSend={handleVoiceSend}
        onCancel={() => setShowVoiceRecorder(false)}
        disabled={disabled || isUploading}
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '8px',
      background: 'var(--white)',
      borderRadius: '12px',
      boxShadow: '0 2px 8px var(--shadow)',
      border: '1px solid var(--border-color)'
    }}>
      {/* Image Upload */}
      <button
        onClick={() => imageInputRef.current?.click()}
        disabled={disabled}
        style={{
          background: 'var(--accent-light)',
          border: '2px solid var(--primary-light)',
          borderRadius: '8px',
          padding: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => !disabled && (e.target.style.background = 'var(--primary-light)')}
        onMouseLeave={(e) => !disabled && (e.target.style.background = 'var(--accent-light)')}
        title="Upload Image"
      >
        📸
      </button>
      
      {/* Video Upload */}
      <button
        onClick={() => videoInputRef.current?.click()}
        disabled={disabled}
        style={{
          background: 'var(--accent-light)',
          border: '2px solid var(--primary-light)',
          borderRadius: '8px',
          padding: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => !disabled && (e.target.style.background = 'var(--primary-light)')}
        onMouseLeave={(e) => !disabled && (e.target.style.background = 'var(--accent-light)')}
        title="Upload Video"
      >
        🎬
      </button>
      
      {/* Audio Upload */}
      <button
        onClick={() => audioInputRef.current?.click()}
        disabled={disabled}
        style={{
          background: 'var(--accent-light)',
          border: '2px solid var(--primary-light)',
          borderRadius: '8px',
          padding: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => !disabled && (e.target.style.background = 'var(--primary-light)')}
        onMouseLeave={(e) => !disabled && (e.target.style.background = 'var(--accent-light)')}
        title="Upload Audio"
      >
        🎵
      </button>
      
      {/* File Upload */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        style={{
          background: 'var(--accent-light)',
          border: '2px solid var(--primary-light)',
          borderRadius: '8px',
          padding: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => !disabled && (e.target.style.background = 'var(--primary-light)')}
        onMouseLeave={(e) => !disabled && (e.target.style.background = 'var(--accent-light)')}
        title="Upload File"
      >
        📎
      </button>
      
      {/* Voice Recorder */}
      <button
        onClick={() => setShowVoiceRecorder(true)}
        disabled={disabled}
        style={{
          background: 'var(--gradient-primary)',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          color: 'white',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(139, 74, 74, 0.3)'
        }}
        onMouseEnter={(e) => !disabled && (e.target.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => !disabled && (e.target.style.transform = 'translateY(0)')}
        title="Voice Message"
      >
        🎤
      </button>
      
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        style={{ display: 'none' }}
      />
      
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        style={{ display: 'none' }}
      />
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default MediaUpload;