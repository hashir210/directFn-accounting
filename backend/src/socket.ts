import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server;

// Map to store connected users: userId -> Set of socket IDs (to support multiple tabs/devices)
const connectedUsers = new Map<string, Set<string>>();

export const initSocket = (server: HTTPServer) => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('[Socket] JWT_ACCESS_SECRET environment variable is not set. Socket authentication will fail.');
  }

  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    // Authenticate the socket
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: no token provided'));
    }
    
    try {
      const decoded = jwt.verify(token, secret) as { id: string; organizationId?: string };
      if (!decoded.id) {
        return next(new Error('Authentication error: token missing user id'));
      }
      socket.data.userId = decoded.id;
      socket.data.organizationId = decoded.organizationId;
      next();
    } catch (err: any) {
      const message = err?.message || 'Authentication error';
      next(new Error(`Authentication error: ${message}`));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] User connected: ${userId} (Socket: ${socket.id})`);
    
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);
    
    // Join a room for the user to easily emit to all their devices
    socket.join(userId);

    // Join the organization's admin room for broadcast events (like audit logs)
    if (socket.data.organizationId) {
      socket.join(`org_${socket.data.organizationId}_admins`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${userId} (Socket: ${socket.id})`);
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
    });
  });
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};
