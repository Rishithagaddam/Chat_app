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
    <div className="auth">
      {mode === 'register' ? <h2>Register</h2> : <h2>Login</h2>}
      {err && <div className="error">{err}</div>}

      {mode === 'register' ? (
        <form onSubmit={submitRegister}>
          <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          <input placeholder="Phone" value={form.phoneNumber} onChange={e=>setForm({...form, phoneNumber:e.target.value})} />
          <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
          <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={()=>{ setMode('login'); setErr(''); }}>Already have an account? Login</button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitLogin}>
          <input placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} />
          <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} />
          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
          <div style={{ marginTop: 8 }}>
            <button type="button" onClick={()=>{ setMode('register'); setErr(''); }}>Need an account? Register</button>
          </div>
        </form>
      )}
    </div>
  );
}