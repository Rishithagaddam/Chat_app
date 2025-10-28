import React, { useState, useRef } from 'react';
import FilePreview from './FilePreview';

// Image Message Component
export const ImageMessage = ({ message, isOwn }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showFullSize, setShowFullSize] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageClick = () => {
    setShowFullSize(true);
  };

  const handleCloseFullSize = () => {
    setShowFullSize(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <div style={{
        maxWidth: '300px',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--accent-light)',
        border: '1px solid var(--border-color)'
      }}>
        {isLoading && (
          <div style={{
            width: '300px',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--accent-light)',
            color: 'var(--text-light)'
          }}>
            📸 Loading image...
          </div>
        )}
        
        <img
          src={`http://localhost:5000${message.fileUrl}`}
          alt={message.fileName || 'Image'}
          onLoad={handleImageLoad}
          onClick={handleImageClick}
          style={{
            width: '100%',
            height: 'auto',
            maxHeight: '400px',
            objectFit: 'cover',
            cursor: 'pointer',
            display: isLoading ? 'none' : 'block',
            transition: 'transform 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        />
        
        {message.message && (
          <div style={{
            padding: '8px 12px',
            fontSize: '14px',
            color: 'var(--text-dark)',
            background: 'rgba(255, 255, 255, 0.8)'
          }}>
            {message.message}
          </div>
        )}
        
        <div style={{
          padding: '4px 8px',
          fontSize: '11px',
          color: 'var(--text-light)',
          background: 'rgba(0, 0, 0, 0.05)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>{message.fileName}</span>
          <span>{formatFileSize(message.fileSize)}</span>
        </div>
      </div>

      {/* Full-size overlay */}
      {showFullSize && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          cursor: 'pointer'
        }} onClick={handleCloseFullSize}>
          <img
            src={`http://localhost:5000${message.fileUrl}`}
            alt={message.fileName || 'Image'}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain'
            }}
          />
          <button
            onClick={handleCloseFullSize}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

// Audio Message Component
export const AudioMessage = ({ message, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    setCurrentTime(audio.currentTime);
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    const newTime = (percentage / 100) * audio.duration;
    audio.currentTime = newTime;
    setProgress(percentage);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: isOwn ? 'rgba(255, 255, 255, 0.1)' : 'var(--accent-light)',
      borderRadius: '12px',
      maxWidth: '300px',
      border: '1px solid var(--border-color)'
    }}>
      <button
        onClick={togglePlayPause}
        style={{
          background: 'var(--primary-medium)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      
      <div style={{ flex: 1 }}>
        <div style={{
          height: '4px',
          background: 'var(--border-color)',
          borderRadius: '2px',
          cursor: 'pointer',
          position: 'relative'
        }} onClick={handleSeek}>
          <div style={{
            height: '100%',
            background: 'var(--primary-medium)',
            borderRadius: '2px',
            width: `${progress}%`,
            transition: 'width 0.1s ease'
          }} />
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px',
          fontSize: '12px',
          color: 'var(--text-light)'
        }}>
          <span>🎵 {message.fileName || 'Audio'}</span>
          <span>
            {formatTime(currentTime)} / {formatTime(message.duration || 0)}
          </span>
        </div>
      </div>
      
      <audio
        ref={audioRef}
        src={`http://localhost:5000${message.fileUrl}`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={() => {
          // Update duration if not provided
          if (!message.duration) {
            message.duration = audioRef.current.duration;
          }
        }}
      />
    </div>
  );
};

// Voice Message Component
export const VoiceMessage = ({ message, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    setCurrentTime(audio.currentTime);
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      background: isOwn ? 'rgba(255, 255, 255, 0.1)' : 'var(--accent-light)',
      borderRadius: '20px',
      maxWidth: '250px',
      border: '1px solid var(--primary-light)'
    }}>
      <button
        onClick={togglePlayPause}
        style={{
          background: 'var(--primary-medium)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        {isPlaying ? '⏸️' : '🎤'}
      </button>
      
      <div style={{ flex: 1 }}>
        {/* Voice wave visualization (simplified) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          height: '20px',
          marginBottom: '4px'
        }}>
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              style={{
                width: '3px',
                height: `${Math.random() * 16 + 4}px`,
                background: progress > (i / 15) * 100 ? 'var(--primary-medium)' : 'var(--border-color)',
                borderRadius: '1px',
                transition: 'background 0.1s ease'
              }}
            />
          ))}
        </div>
        
        <div style={{
          fontSize: '11px',
          color: 'var(--text-light)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Voice message</span>
          <span>{formatTime(currentTime)} / {formatTime(message.duration || 0)}</span>
        </div>
      </div>
      
      <audio
        ref={audioRef}
        src={`http://localhost:5000${message.fileUrl}`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  );
};

// Video Message Component
export const VideoMessage = ({ message, isOwn }) => {
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef(null);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      maxWidth: '300px',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'var(--accent-light)',
      border: '1px solid var(--border-color)'
    }}>
      <div
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        style={{ position: 'relative' }}
      >
        <video
          ref={videoRef}
          width="100%"
          height="auto"
          style={{ maxHeight: '400px', objectFit: 'cover' }}
          poster={message.thumbnailUrl ? `http://localhost:5000${message.thumbnailUrl}` : undefined}
          controls={showControls}
        >
          <source src={`http://localhost:5000${message.fileUrl}`} type={message.mimeType} />
          Your browser does not support the video tag.
        </video>
        
        {!showControls && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '50%',
            width: '60px',
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer'
          }}>
            ▶️
          </div>
        )}
      </div>
      
      {message.message && (
        <div style={{
          padding: '8px 12px',
          fontSize: '14px',
          color: 'var(--text-dark)',
          background: 'rgba(255, 255, 255, 0.8)'
        }}>
          {message.message}
        </div>
      )}
      
      <div style={{
        padding: '4px 8px',
        fontSize: '11px',
        color: 'var(--text-light)',
        background: 'rgba(0, 0, 0, 0.05)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>🎬 {message.fileName}</span>
        <span>{formatFileSize(message.fileSize)} • {formatDuration(message.duration || 0)}</span>
      </div>
    </div>
  );
};

// File Message Component
export const FileMessage = ({ message, isOwn }) => {
  const [showPreview, setShowPreview] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return '📈';
    if (mimeType?.includes('zip') || mimeType?.includes('compressed')) return '🗜️';
    if (mimeType?.includes('text')) return '📃';
    return '📎';
  };

  const canPreview = (mimeType) => {
    return mimeType?.startsWith('image/') || 
           mimeType?.startsWith('application/pdf') ||
           mimeType?.startsWith('text/');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000${message.fileUrl}`;
    link.download = message.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (e) => {
    e.stopPropagation();
    setShowPreview(true);
  };

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        background: isOwn ? 'rgba(255, 255, 255, 0.1)' : 'var(--accent-light)',
        borderRadius: '12px',
        maxWidth: '300px',
        border: '1px solid var(--border-color)',
        cursor: 'pointer'
      }} onClick={handleDownload}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        background: 'var(--primary-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        {getFileIcon(message.mimeType)}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--text-dark)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {message.fileName}
        </div>
        
        <div style={{
          fontSize: '12px',
          color: 'var(--text-light)',
          marginTop: '2px'
        }}>
          {formatFileSize(message.fileSize)}
        </div>
        
        {message.message && (
          <div style={{
            fontSize: '13px',
            color: 'var(--text-dark)',
            marginTop: '4px',
            fontStyle: 'italic'
          }}>
            {message.message}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        {canPreview(message.mimeType) && (
          <div 
            onClick={handlePreview}
            style={{
              padding: '8px',
              borderRadius: '8px',
              background: 'var(--accent-medium)',
              color: 'var(--primary-dark)',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            👁️
          </div>
        )}
        
        <div style={{
          padding: '8px',
          borderRadius: '8px',
          background: 'var(--primary-medium)',
          color: 'white',
          fontSize: '16px'
        }}>
          ⬇️
        </div>
      </div>
    </div>
    
    {showPreview && (
      <FilePreview
        fileName={message.fileName}
        fileUrl={`http://localhost:5000${message.fileUrl}`}
        mimeType={message.mimeType}
        fileSize={message.fileSize}
        onClose={() => setShowPreview(false)}
      />
    )}
  </>);
};

// Main MediaMessages component that renders the appropriate message type
const MediaMessages = ({ message, isSent, senderName }) => {
  const messageType = message.messageType || 'text';

  switch (messageType) {
    case 'image':
      return (
        <div className="media-message" style={{ maxWidth: '280px', borderRadius: '12px', overflow: 'hidden' }}>
          <img 
            src={fileUrl.startsWith('blob:') ? fileUrl : `${baseUrl}${fileUrl}`}
            alt={fileName || 'Image'}
            style={{ 
              width: '100%', 
              height: 'auto',
              display: 'block',
              cursor: 'pointer',
              borderRadius: '8px'
            }}
            onClick={() => {
              const fullUrl = fileUrl.startsWith('blob:') ? fileUrl : `${baseUrl}${fileUrl}`;
              window.open(fullUrl, '_blank');
            }}
          />
          {message.message && (
            <div style={{ 
              padding: '8px', 
              background: 'rgba(0,0,0,0.7)', 
              color: 'white',
              fontSize: '12px',
              borderRadius: '0 0 8px 8px'
            }}>
              {message.message}
            </div>
          )}
          <div style={{ 
            padding: '4px 8px', 
            fontSize: '10px', 
            color: 'var(--text-light)',
            background: 'rgba(255,255,255,0.9)'
          }}>
            📷 {formatFileSize(fileSize)}
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="media-message" style={{ maxWidth: '280px', borderRadius: '12px', overflow: 'hidden' }}>
          <video 
            controls 
            style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
            preload="metadata"
          >
            <source src={fileUrl.startsWith('blob:') ? fileUrl : `${baseUrl}${fileUrl}`} type={mimeType} />
            Your browser does not support video playback.
          </video>
          <div style={{ 
            padding: '6px 8px', 
            background: 'var(--accent-light)',
            fontSize: '11px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>🎥 {fileName}</span>
            <span style={{ color: 'var(--text-light)' }}>{formatDuration(duration)}</span>
          </div>
          {message.message && (
            <div style={{ padding: '8px', fontSize: '13px', borderTop: '1px solid var(--border-color)' }}>
              {message.message}
            </div>
          )}
        </div>
      );

    case 'audio':
      return <AudioMessage message={message} isOwn={isSent} />;
    case 'voice':
      return <VoiceMessage message={message} isOwn={isSent} />;
    case 'file':
      return <FileMessage message={message} isOwn={isSent} />;
    default:
      return <div>{message.message}</div>;
  }
};

export default MediaMessages;