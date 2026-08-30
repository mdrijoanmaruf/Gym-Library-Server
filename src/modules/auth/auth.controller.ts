import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { env } from '../../config/env';
import { R2Service } from '../../services/r2.service';
import { AppError } from '../../utils/AppError';

export class AuthController {
  static async register(req: Request, res: Response) {
    const user = await AuthService.register(req.body);
    res.status(201).json({
      message: 'Registration successful. Account pending approval.',
      user,
    });
  }

  static async login(req: Request, res: Response) {
    const { user, accessToken, refreshToken } = await AuthService.login(req.body);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({ user, accessToken });
  }

  static async googleLogin(req: Request, res: Response) {
    const { user, accessToken, refreshToken } = await AuthService.googleLogin(req.body);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(200).json({ user, accessToken });
  }

  static async me(req: Request, res: Response) {
    // req.user is set by authenticate middleware
    res.status(200).json({ user: req.user });
  }

  static async updateMe(req: Request, res: Response) {
    const user = req.user as any;
    if (!user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const { image, name, bio } = req.body;
    
    if (image !== undefined) user.image = image;
    if (name !== undefined) user.name = name;
    // bio etc. could be added to User model in the future

    await user.save();
    res.status(200).json({ success: true, user });
  }

  static async getAvatarUploadUrl(req: Request, res: Response) {
    const user = req.user as any;
    if (!user) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const { contentType } = req.body;
    if (!contentType) throw new AppError('contentType is required', 400, 'BAD_REQUEST');

    // Create a unique key for the avatar
    const timestamp = Date.now();
    const extension = contentType === 'image/png' ? 'png' : 'jpg';
    const r2Key = `avatars/${user.id}-${timestamp}.${extension}`;

    const uploadUrl = await R2Service.generatePresignedPutUrl(r2Key, contentType);
    const publicUrl = `${env.PORT ? `http://localhost:${env.PORT}` : ''}/api/auth/avatar/${encodeURIComponent(r2Key)}`;
    
    res.status(200).json({ uploadUrl, r2Key, publicUrl });
  }

  static async getAvatarStream(req: Request, res: Response, next: import('express').NextFunction) {
    try {
      const r2Key = req.params.key;
      const r2Object = await R2Service.getObjectStream(r2Key);
      
      if (r2Object.ContentType) res.setHeader('Content-Type', r2Object.ContentType);
      if (r2Object.ContentLength) res.setHeader('Content-Length', r2Object.ContentLength.toString());
      
      const stream = r2Object.Body as NodeJS.ReadableStream;
      stream.pipe(res);
      
      stream.on('error', (err) => {
        console.error('Error streaming avatar:', err);
        if (!res.headersSent) res.status(500).end();
      });
    } catch (error: any) {
      if (error.name === 'NoSuchKey') return next(new AppError('Avatar not found', 404, 'NOT_FOUND'));
      next(error);
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('refresh_token');
    res.status(200).json({ message: 'Logged out successfully' });
  }

  static async getUsers(req: Request, res: Response) {
    const role = req.query.role as string;
    const users = await AuthService.getUsers(role);
    res.status(200).json({ success: true, users });
  }

  static async updateUserRole(req: Request, res: Response) {
    const { id } = req.params;
    const { role } = req.body;
    const user = await AuthService.updateUserRole(id, role);
    res.status(200).json({ success: true, user });
  }
}
