import { Request, Response, NextFunction } from 'express';
import { Message } from '../../models/Message';
import { AppError } from '../../utils/AppError';

export class MessageController {
  
  // Public route to submit a message
  static async submitMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, message } = req.body;
      
      if (!name || !email || !message) {
        return next(new AppError('Name, email, and message are required', 400, 'VALIDATION_ERROR'));
      }

      const newMessage = await Message.create({ name, email, message });
      res.status(201).json({ success: true, message: 'Message sent successfully', data: newMessage });
    } catch (error) {
      next(error);
    }
  }

  // Admin route to get all messages
  static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const messages = await Message.find().sort({ createdAt: -1 });
      res.json(messages);
    } catch (error) {
      next(error);
    }
  }

  // Admin route to mark message as read
  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await Message.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true }
      );
      
      if (!message) {
        return next(new AppError('Message not found', 404, 'NOT_FOUND'));
      }
      
      res.json({ success: true, message: 'Marked as read', data: message });
    } catch (error) {
      next(error);
    }
  }

  // Admin route to delete message
  static async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await Message.findByIdAndDelete(req.params.id);
      
      if (!message) {
        return next(new AppError('Message not found', 404, 'NOT_FOUND'));
      }
      
      res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
      next(error);
    }
  }
}
