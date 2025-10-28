import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from './api';
import { connectSocket, disconnectSocket, getSocket } from './socket';
import { fetchRequests, fetchContacts } from './features/contacts/contactsSlice';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Chat from './pages/Chat';
import Groups from './pages/Groups';
import GroupCreate from './pages/GroupCreate';
import ContactsList from './pages/ContactsList';
import ContactRequests from './pages/ContactRequests';
import GroupChat from './pages/GroupChat';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    api.setToken(token);

    let s = null;
    if (token) {
      connectSocket(token);
      s = getSocket();
      // listen for contact events and refresh lists
      if (s) {
        s.on('contactRequest', (payload) => {
          // payload: { toUserId, from: { id, name, email } }
          const currentUserId = user?.id || user?._id;
          if (payload?.toUserId && String(payload.toUserId) === String(currentUserId)) {
            dispatch(fetchRequests());
          }
        });
        s.on('contactAccepted', () => {
          dispatch(fetchContacts());
          dispatch(fetchRequests());
        });
        
        // Handle real-time online/offline status updates
        s.on('userOnline', (data) => {
          console.log('🟢 User came online:', data.user.name);
          // Refresh contacts and users to update online status
          dispatch(fetchContacts());
        });
        
        s.on('userOffline', (data) => {
          console.log('🔴 User went offline:', data.user.name);
          // Refresh contacts and users to update offline status
          dispatch(fetchContacts());
        });

        // Handle list of online users on connect
        s.on('onlineUsers', (users) => {
          console.log('📋 Received online users list:', users.length);
          // This can be used to update the UI with current online users
        });
      }
    } else {
      disconnectSocket();
    }

    return () => {
      if (s) {
        s.off('contactRequest');
        s.off('contactAccepted');
        s.off('userOnline');
        s.off('userOffline');
        s.off('onlineUsers');
      }
      disconnectSocket();
    };
  }, [token, user, dispatch]);

  const handleLogin = ({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.setToken(null);
    disconnectSocket();
    setToken(null);
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin}/> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register onRegister={handleLogin}/> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Dashboard user={user} onLogout={handleLogout}/> : <Navigate to="/login" />} >
          <Route index element={<Users />} />
          <Route path="users" element={<Users />} />
          <Route path="chat/:id" element={<Chat currentUser={user} />} />
          <Route path="groups" element={<Groups currentUser={user} />} />
          <Route path="groups/new" element={<GroupCreate currentUser={user} />} />
          <Route path="groups/:id" element={<GroupChat currentUser={user} />} />
          <Route path="contacts" element={<ContactsList currentUser={user} />} />
          <Route path="requests" element={<ContactRequests currentUser={user} />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
