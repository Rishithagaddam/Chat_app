import React, { useState } from 'react';
import api from '../api';

export default function Register({ onRegister }) {
  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const [form, setForm] = useState({ name:'', email:'', phoneNumber:'', password:'' });
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submitRegister = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.name.trim() || !form.email.trim() || !form.phoneNumber.trim() || !form.password) {
      setErr('All fields are required for registration');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      onRegister({ token: res.data.token, user: res.data.user });
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      // If user already exists, switch to login mode and prefill email
      if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('user already exists')) {
        setMode('login');
        setForm(prev => ({ ...prev, password: '', phoneNumber: prev.email || prev.phoneNumber }));
        setErr('User already exists — please enter your password to login');
      } else {
        setErr(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setErr('');
    if (!form.email.trim() || !form.password) {
      setErr('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { emailOrPhone: form.email.trim(), password: form.password });
      onRegister({ token: res.data.token, user: res.data.user });
    } catch (error) {
      setErr(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth fade-in">
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ 
          fontSize: '48px', 
          marginBottom: '20px',
          background: 'var(--gradient-primary)',
          borderRadius: '50%',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          boxShadow: '0 8px 32px var(--shadow)'
        }}>
          💬
        </div>
        {mode === 'register' ? <h2>✨ Create Account</h2> : <h2>🔑 Welcome Back</h2>}
        <p className="text-light" style={{ marginBottom: '30px' }}>
          {mode === 'register' 
            ? 'Join our community and start connecting!' 
            : 'Sign in to continue your conversations'
          }
        </p>
      </div>

      {err && <div className="error">{err}</div>}

      {mode === 'register' ? (
        <form onSubmit={submitRegister}>
          <input placeholder="👤 Full Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <input placeholder="📧 Email Address" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          <input placeholder="📱 Phone Number" value={form.phoneNumber} onChange={e=>setForm({...form, phoneNumber:e.target.value})} />
          <input placeholder="🔒 Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
          <div style={{ marginTop: '20px' }}>
            <button type="submit" disabled={loading}>
              {loading ? '✨ Creating Account...' : '🚀 Create Account'}
            </button>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button type="button" onClick={()=>{ setMode('login'); setErr(''); }}>
              Already have an account? Sign In
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitLogin}>
          <input placeholder="📧 Email Address" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          <input placeholder="🔒 Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
          <div style={{ marginTop: '20px' }}>
            <button type="submit" disabled={loading}>
              {loading ? '🔓 Signing In...' : '🎯 Sign In'}
            </button>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button type="button" onClick={()=>{ setMode('register'); setErr(''); }}>
              Need an account? Create One
            </button>
          </div>
        </form>
      )}

      <div style={{ 
        marginTop: '30px', 
        paddingTop: '20px', 
        borderTop: '1px solid var(--border-color)', 
        textAlign: 'center' 
      }}>
        <small className="text-light">
          🔐 Your data is secure and protected
        </small>
      </div>
    </div>
  );
}