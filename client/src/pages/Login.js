import React, { useState } from 'react';
import api from '../api';

function randomPassword(len = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function Login({ onLogin }) {
  const [step, setStep] = useState('identify'); // 'identify' or 'password'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submitIdentify = async (e) => {
    e?.preventDefault();
    setErr('');
    if (!name.trim() || !email.trim()) { setErr('Name and email are required'); return; }

    setLoading(true);
    try {
      // Try to register using email also as phoneNumber to satisfy server validation
      const tempPwd = randomPassword(12);
      const payload = { name: name.trim(), email: email.trim(), phoneNumber: email.trim(), password: tempPwd };
      const res = await api.post('/auth/register', payload);
      // registration succeeded -> logged in
      onLogin({ token: res.data.token, user: res.data.user });
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      // If user already exists, ask for password (fall back to login)
      if (message.toLowerCase().includes('user already exists') || message.toLowerCase().includes('already exists')) {
        setStep('password');
        setErr('User exists — please enter your password to login');
      } else {
        setErr(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e?.preventDefault();
    setErr('');
    if (!email.trim() || !password) { setErr('Email and password are required'); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { emailOrPhone: email.trim(), password });
      onLogin({ token: res.data.token, user: res.data.user });
    } catch (error) {
      setErr(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <h2>Login / Quick register</h2>
      {err && <div className="error">{err}</div>}

      {step === 'identify' ? (
        <form onSubmit={submitIdentify}>
          <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <div style={{ marginTop: 8 }}>
            <button type="submit" disabled={loading}>{loading ? 'Please wait...' : 'Continue'}</button>
            {' '}
            <a href="/register">Full register</a>
          </div>
        </form>
      ) : (
        <form onSubmit={submitPassword}>
          <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
          <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <div style={{ marginTop: 8 }}>
            <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
            {' '}
            <button type="button" onClick={()=>setStep('identify')}>Back</button>
          </div>
        </form>
      )}

      <div style={{ marginTop: 12 }}>
        <small>Note: this will try to create an account if one doesn’t exist. If the user exists you will be asked for password.</small>
      </div>
    </div>
  );
}