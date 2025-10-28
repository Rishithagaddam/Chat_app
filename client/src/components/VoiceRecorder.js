import React, { useState, useRef, useEffect } from 'react';

const VoiceRecorder = ({ onSend, onCancel, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Play recorded audio
  const playRecording = () => {
    if (audioBlob && audioRef.current) {
      const audioUrl = URL.createObjectURL(audioBlob);
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Pause audio
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Send voice message
  const handleSend = () => {
    if (audioBlob && onSend) {
      onSend(audioBlob, duration);
      resetRecorder();
    }
  };

  // Cancel recording
  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    resetRecorder();
    if (onCancel) onCancel();
  };

  // Reset recorder state
  const resetRecorder = () => {
    setAudioBlob(null);
    setDuration(0);
    setIsPlaying(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle audio events
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  if (!isRecording && !audioBlob) {
    // Initial state - show record button
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px',
        background: 'var(--white)',
        borderRadius: '20px',
        boxShadow: '0 4px 15px var(--shadow)',
        border: '2px solid var(--border-color)'
      }}>
        <button
          onClick={startRecording}
          disabled={disabled}
          style={{
            background: 'var(--gradient-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '20px',
            transition: 'all 0.3s ease',
            opacity: disabled ? 0.6 : 1
          }}
          onMouseEnter={(e) => !disabled && (e.target.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => !disabled && (e.target.style.transform = 'scale(1)')}
        >
          🎤
        </button>
        <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>
          Tap to record voice message
        </span>
      </div>
    );
  }

  if (isRecording) {
    // Recording state
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(255, 107, 107, 0.3)',
        color: 'white'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: 1
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'white',
            animation: 'pulse 1s infinite'
          }} />
          <span style={{ fontWeight: '600' }}>Recording...</span>
          <span style={{ 
            fontFamily: 'monospace',
            fontSize: '16px',
            fontWeight: '700'
          }}>
            {formatDuration(duration)}
          </span>
        </div>
        
        <button
          onClick={stopRecording}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: '2px solid white',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
        >
          ⏹️ Stop
        </button>
      </div>
    );
  }

  // Preview state (after recording)
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      background: 'var(--white)',
      borderRadius: '20px',
      boxShadow: '0 4px 20px var(--shadow)',
      border: '2px solid var(--primary-light)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <button
          onClick={isPlaying ? pauseAudio : playRecording}
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
            fontSize: '16px',
            transition: 'all 0.3s ease'
          }}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div style={{ flex: 1 }}>
          <div style={{
            height: '4px',
            background: 'var(--accent-light)',
            borderRadius: '2px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'var(--primary-medium)',
              borderRadius: '2px',
              width: '30%', // This could be dynamic based on playback progress
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
            fontSize: '12px',
            color: 'var(--text-light)'
          }}>
            <span>Voice Message</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={handleCancel}
          style={{
            background: 'var(--white)',
            color: 'var(--text-light)',
            border: '2px solid var(--border-color)',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease'
          }}
        >
          🗑️ Delete
        </button>
        
        <button
          onClick={handleSend}
          style={{
            background: 'var(--gradient-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(139, 74, 74, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          ✈️ Send
        </button>
      </div>
      
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default VoiceRecorder;