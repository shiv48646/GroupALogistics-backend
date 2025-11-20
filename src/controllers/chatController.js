const Chat = require('../models/Chat');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;
const path = require('path');

// Send message with optional attachment
exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId, message } = req.body;
    const senderId = req.user._id;
    
    // Validate conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Check if user is part of the conversation
    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    let attachmentData = null;

    // Handle file upload if present
    if (req.file) {
      try {
        // Upload to Cloudinary (optional - you can skip this and use local storage)
        if (process.env.CLOUDINARY_CLOUD_NAME) {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'chat_attachments',
            resource_type: 'auto'
          });

          attachmentData = {
            url: result.secure_url,
            publicId: result.public_id,
            type: req.file.mimetype,
            name: req.file.originalname,
            size: req.file.size
          };

          // Delete local file after upload to cloud
          await fs.unlink(req.file.path);
        } else {
          // Use local storage
          attachmentData = {
            url: `${process.env.BASE_URL || 'http://localhost:5000'}/${req.file.path.replace(/\\/g, '/')}`,
            type: req.file.mimetype,
            name: req.file.originalname,
            size: req.file.size
          };
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        // Continue without attachment if upload fails
      }
    }

    // Validate that there's either a message or an attachment
    if (!message && !attachmentData) {
      return res.status(400).json({
        success: false,
        message: 'Message or attachment is required'
      });
    }

    // Create new message
    const newMessage = new Chat({
      conversationId,
      sender: senderId,
      message: message || '',
      attachment: attachmentData,
      timestamp: new Date()
    });

    await newMessage.save();

    // Update conversation's last message
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message || '📎 Attachment',
      lastMessageTime: new Date()
    });

    // Populate sender info
    await newMessage.populate('sender', 'name email avatar');

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').to(conversationId.toString()).emit('new_message', newMessage);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    next(error);
  }
};

// Get messages with pagination
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await Chat.find({ conversationId })
      .populate('sender', 'name email avatar')
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Chat.countDocuments({ conversationId });

    res.status(200).json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    next(error);
  }
};

// Get user conversations
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email avatar')
      .sort({ lastMessageTime: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: conversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    next(error);
  }
};

// Create or get existing conversation
exports.createConversation = async (req, res, next) => {
  try {
    const { participantIds, name, isGroup } = req.body;
    const userId = req.user._id;

    // Add current user to participants
    const allParticipants = [...new Set([userId.toString(), ...participantIds])];

    // Check if conversation already exists (for non-group chats)
    if (!isGroup && allParticipants.length === 2) {
      const existing = await Conversation.findOne({
        participants: { $all: allParticipants, $size: 2 },
        isGroup: false
      }).populate('participants', 'name email avatar');

      if (existing) {
        return res.status(200).json({
          success: true,
          message: 'Conversation already exists',
          data: existing
        });
      }
    }

    // Create new conversation
    const conversation = new Conversation({
      name: name || null,
      participants: allParticipants,
      isGroup: isGroup || false,
      createdBy: userId
    });

    await conversation.save();
    await conversation.populate('participants', 'name email avatar');

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation
    });

  } catch (error) {
    console.error('Create conversation error:', error);
    next(error);
  }
};

// Delete message
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Chat.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Delete attachment from cloud if exists
    if (message.attachment && message.attachment.publicId) {
      try {
        await cloudinary.uploader.destroy(message.attachment.publicId);
      } catch (err) {
        console.error('Error deleting attachment:', err);
      }
    }

    await message.deleteOne();

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').to(message.conversationId.toString()).emit('message_deleted', messageId);
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    next(error);
  }
};