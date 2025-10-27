import { io } from 'socket.io-client';

const SERVER = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/api$/, '');

let socket = null;

export function connectSocket(token) {
  if (!token) return null;
  socket = io(SERVER, {
    auth: { token },
    transports: ['websocket']
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}