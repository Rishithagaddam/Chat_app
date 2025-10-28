import React, { useState } from 'react';

const FilePreview = ({ fileName, fileUrl, mimeType, fileSize, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType, fileName) => {
    if (mimeType?.startsWith('application/pdf')) return '📄';
    if (mimeType?.startsWith('image/')) return '🖼️';
    if (mimeType?.startsWith('video/')) return '🎬';
    if (mimeType?.startsWith('audio/')) return '🎵';
    if (mimeType?.includes('word') || fileName?.includes('.doc')) return '📝';
    if (mimeType?.includes('excel') || fileName?.includes('.xls')) return '📊';
    if (mimeType?.includes('powerpoint') || fileName?.includes('.ppt')) return '📽️';
    if (mimeType?.includes('zip') || mimeType?.includes('rar')) return '🗜️';
    if (mimeType?.includes('text')) return '📋';
    return '📎';
  };

  const canPreview = (mimeType) => {
    return mimeType?.startsWith('image/') || 
           mimeType?.startsWith('application/pdf') ||
           mimeType?.startsWith('text/');
  };

  const renderPreview = () => {
    if (!canPreview(mimeType)) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          color: 'var(--text-light)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {getFileIcon(mimeType, fileName)}
          </div>
          <h3 style={{ color: 'var(--primary-medium)', marginBottom: '8px' }}>
            Preview not available
          </h3>
          <p>Click download to view this file</p>
        </div>
      );
    }

    if (mimeType?.startsWith('image/')) {
      return (
        <img
          src={fileUrl}
          alt={fileName}
          onLoad={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false); }}
          style={{
            maxWidth: '100%',
            maxHeight: '70vh',
            objectFit: 'contain',
            borderRadius: '8px'
          }}
        />
      );
    }

    if (mimeType === 'application/pdf') {
      return (
        <embed
          src={fileUrl}
          type="application/pdf"
          width="100%"
          height="70vh"
          onLoad={() => setLoading(false)}
          style={{ borderRadius: '8px' }}
        />
      );
    }

    if (mimeType?.startsWith('text/')) {
      return (
        <iframe
          src={fileUrl}
          width="100%"
          height="70vh"
          onLoad={() => setLoading(false)}
          style={{ 
            border: 'none', 
            borderRadius: '8px',
            background: 'white' 
          }}
          title={fileName}
        />
      );
    }

    return null;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
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
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: '16px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--accent-light)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>
              {getFileIcon(mimeType, fileName)}
            </span>
            <div>
              <h3 style={{ 
                margin: 0, 
                color: 'var(--primary-dark)',
                fontSize: '18px',
                wordBreak: 'break-word'
              }}>
                {fileName}
              </h3>
              <p style={{ 
                margin: 0, 
                color: 'var(--text-light)', 
                fontSize: '14px' 
              }}>
                {formatFileSize(fileSize)}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleDownload}
              style={{
                background: 'var(--primary-medium)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              ⬇️ Download
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'var(--danger)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          position: 'relative',
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {loading && !error && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--primary-medium)'
            }}>
              <div className="spinner" style={{
                width: '24px',
                height: '24px',
                border: '3px solid var(--accent-light)',
                borderTop: '3px solid var(--primary-medium)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Loading preview...
            </div>
          )}

          {error && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: 'var(--danger)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <h3>Failed to load preview</h3>
              <p>Try downloading the file instead</p>
            </div>
          )}

          {!error && renderPreview()}
        </div>
      </div>
    </div>
  );
};

export default FilePreview;