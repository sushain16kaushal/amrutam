import { io, Socket } from 'socket.io-client';

// Backend URL, /api suffix hataya kyunki Socket.io root pe attach hota hai, /api route pe nahi
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function createSocket(token: string): Socket {
  return io(SOCKET_URL, {
    auth: { token }
  });
}
