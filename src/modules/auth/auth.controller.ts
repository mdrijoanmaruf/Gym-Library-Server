import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { env } from '../../config/env';

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

  static async logout(req: Request, res: Response) {
    res.clearCookie('refresh_token');
    res.status(200).json({ message: 'Logged out successfully' });
  }
}
