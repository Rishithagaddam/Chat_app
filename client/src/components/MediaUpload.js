import React, { useRef, useState } from 'react';
import api from '../api';

const MediaUpload = ({ onSend, disabled, receiverId, groupId }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState(null);
  const imageRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const fileRef = useRef(null);

  const handleUpload = async (file, type) => {
    if (!file || uploading) return;

    setUploading(true);
    setUploadType(type);

    try {
      // For now, create a mock message since we don't have the actual upload endpoint
      const mockMessage = {
        _id: `media-${Date.now()}`,
        messageType: type,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: URL.createObjectURL(file), // Temporary URL for preview
        message: '', // No caption for now
        sender: {
          _id: 'current_user',
          name: 'Current User'
        },
        createdAt: new Date().toISOString()
      };

      // Add duration for audio/video files if available
      if (type === 'audio' || type === 'video') {
        const mediaElement = document.createElement(type);
        mediaElement.src = mockMessage.fileUrl;
        mediaElement.onloadedmetadata = () => {
          mockMessage.duration = mediaElement.duration;
        };
      }

      // Add dimensions for images
      if (type === 'image') {
        const img = new Image();
        img.onload = () => {
          mockMessage.dimensions = {
            width: img.width,
            height: img.height
          };
        };
        img.src = mockMessage.fileUrl;
      }

      onSend(mockMessage);
      
      // Update the media files list if we're in a group
      if (groupId) {
        // Trigger a refresh of media files
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshGroupMedia', { detail: { groupId } }));
        }, 100);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to process file. Please try again.');
    } finally {
      setUploading(false);
      setUploadType(null);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file, 'image');
    }
    e.target.value = '';
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file, 'audio');
    }
    e.target.value = '';
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file, 'video');
    }
    e.target.value = '';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleUpload(file, 'file');
    }
    e.target.value = '';
  };

  return (
    <div style={{ 
      display: 'flex', 
      gap: '8px', 
      alignItems: 'center',
      padding: '12px',
      background: 'var(--accent-light)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)'
    }}>
      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}>
        📎 Attach:
      </span>

      {/* Hidden file inputs */}
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={audioRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        onChange={handleVideoUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={fileRef}
        type="file"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Upload buttons */}
      <button
        onClick={() => imageRef.current?.click()}
        disabled={disabled || uploading}
        style={{
          background: uploading && uploadType === 'image' ? 'var(--text-light)' : 'var(--primary-light)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 12px',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          opacity: disabled || uploading ? 0.6 : 1,
          transition: 'all 0.3s ease'
        }}
      >
        {uploading && uploadType === 'image' ? '⏳' : '🖼️'} Photo
      </button>

      <button
        onClick={() => audioRef.current?.click()}
        disabled={disabled || uploading}
        style={{
          background: uploading && uploadType === 'audio' ? 'var(--text-light)' : 'var(--primary-light)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 12px',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          opacity: disabled || uploading ? 0.6 : 1,
          transition: 'all 0.3s ease'
        }}
      >
        {uploading && uploadType === 'audio' ? '⏳' : '🎵'} Audio
      </button>

      <button
        onClick={() => videoRef.current?.click()}
        disabled={disabled || uploading}
        style={{
          background: uploading && uploadType === 'video' ? 'var(--text-light)' : 'var(--primary-light)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 12px',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          opacity: disabled || uploading ? 0.6 : 1,
          transition: 'all 0.3s ease'
        }}
      >
        {uploading && uploadType === 'video' ? '⏳' : '🎥'} Video
      </button>

      <button
        onClick={() => fileRef.current?.click()}
        disabled={disabled || uploading}
        style={{
          background: uploading && uploadType === 'file' ? 'var(--text-light)' : 'var(--primary-light)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '6px 12px',
          cursor: disabled || uploading ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          opacity: disabled || uploading ? 0.6 : 1,
          transition: 'all 0.3s ease'
        }}
      >
        {uploading && uploadType === 'file' ? '⏳' : '📄'} File
      </button>
    </div>
  );
};

export default MediaUpload;