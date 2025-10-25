const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');

module.exports = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

    // Join user's personal room
    socket.join(`user:${socket.user._id}`);

    // Join conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.user.name} joined conversation ${conversationId}`);
    });

    // Leave conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.user.name} left conversation ${conversationId}`);
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, message, type = 'text' } = data;

        // Save message to database
        const newMessage = await Chat.create({
          conversation: conversationId,
          sender: socket.user._id,
          message,
          type,
          timestamp: new Date()
        });

        await newMessage.populate('sender', 'name avatar');

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('new_message', newMessage);

        // Send delivery confirmation to sender
        socket.emit('message_sent', { 
          tempId: data.tempId, 
          message: newMessage 
        });

      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        userId: socket.user._id,
        userName: socket.user.name,
        conversationId: data.conversationId
      });
    });

    // Stop typing
    socket.on('stop_typing', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_stop_typing', {
        userId: socket.user._id,
        conversationId: data.conversationId
      });
    });

    // Mark messages as read
    socket.on('mark_read', async (data) => {
      try {
        const { conversationId, messageIds } = data;

        await Chat.updateMany(
          { _id: { $in: messageIds }, conversation: conversationId },
          { $set: { read: true, readAt: new Date() } }
        );

        // Notify other users in conversation
        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          messageIds,
          readBy: socket.user._id
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Online status
    socket.on('update_status', (status) => {
      io.emit('user_status_changed', {
        userId: socket.user._id,
        status: status // online, away, busy, offline
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name}`);
      
      // Broadcast offline status
      io.emit('user_status_changed', {
        userId: socket.user._id,
        status: 'offline'
      });
    });
  });
};