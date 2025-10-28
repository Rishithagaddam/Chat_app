import React, { useState, useEffect } from 'react';
import api from '../api';

export default function ProfileModal({ isOpen, onClose, user, onProfileUpdate }) {
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    statusMessage: '',
    profilePicture: null
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      loadProfile();
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    try {
      const res = await api.get('/profile');
      const profileData = res.data.profile;
      setProfile({
        name: profileData.name || '',
        bio: profileData.bio || '',
        statusMessage: profileData.statusMessage || '',
        profilePicture: profileData.profilePicture
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePicture = async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const res = await api.post('/profile/picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return res.data.profilePicture;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Handle profile picture upload first if changed
      let profilePictureUrl = profile.profilePicture;
      const fileInput = document.getElementById('profilePictureInput');
      
      if (fileInput.files[0]) {
        setUploading(true);
        profilePictureUrl = await uploadProfilePicture(fileInput.files[0]);
        setUploading(false);
      }

      // Update profile information
      const res = await api.put('/profile', {
        name: profile.name,
        bio: profile.bio,
        statusMessage: profile.statusMessage
      });

      // Update local state
      const updatedProfile = { ...res.data.profile, profilePicture: profilePictureUrl };
      setProfile(updatedProfile);
      
      // Update parent component
      if (onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }

      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        name: updatedProfile.name,
        profilePicture: updatedProfile.profilePicture
      }));

      onClose();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const removeProfilePicture = async () => {
    try {
      await api.delete('/profile/picture');
      setProfile(prev => ({ ...prev, profilePicture: null }));
      setPreviewImage(null);
      
      // Update localStorage
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        profilePicture: null
      }));
    } catch (error) {
      console.error('Failed to remove profile picture:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ margin: 0, color: 'var(--primary-dark)' }}>👤 Edit Profile</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-light)'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Profile Picture Section */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              margin: '0 auto 16px',
              overflow: 'hidden',
              border: '4px solid var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--accent-light)'
            }}>
              {previewImage || profile.profilePicture ? (
                <img
                  src={previewImage || `http://localhost:5000${profile.profilePicture}`}
                  alt="Profile"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ fontSize: '48px', color: 'var(--primary-medium)' }}>
                  👤
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <label style={{
                background: 'var(--primary-medium)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                📷 Change Photo
                <input
                  id="profilePictureInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
              
              {(profile.profilePicture || previewImage) && (
                <button
                  type="button"
                  onClick={removeProfilePicture}
                  style={{
                    background: 'var(--error)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  🗑️ Remove
                </button>
              )}
            </div>
          </div>

          {/* Name Field */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: 'var(--primary-dark)'
            }}>
              Display Name
            </label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleInputChange}
              placeholder="Enter your display name"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '14px'
              }}
              maxLength={50}
              required
            />
          </div>

          {/* Bio Field */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: 'var(--primary-dark)'
            }}>
              Bio
            </label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleInputChange}
              placeholder="Tell others about yourself..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical'
              }}
              maxLength={150}
            />
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-light)', 
              textAlign: 'right',
              marginTop: '4px'
            }}>
              {profile.bio.length}/150
            </div>
          </div>

          {/* Status Message Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '600',
              color: 'var(--primary-dark)'
            }}>
              Status Message
            </label>
            <input
              type="text"
              name="statusMessage"
              value={profile.statusMessage}
              onChange={handleInputChange}
              placeholder="What's on your mind?"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '14px'
              }}
              maxLength={100}
            />
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-light)', 
              textAlign: 'right',
              marginTop: '4px'
            }}>
              {profile.statusMessage.length}/100
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--accent-light)',
                color: 'var(--primary-medium)',
                border: '1px solid var(--border-color)',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              style={{
                background: loading || uploading ? 'var(--text-light)' : 'var(--primary-medium)',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                cursor: loading || uploading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {uploading ? '📤 Uploading...' : loading ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
