import { User } from '../../models/User';
import { AccessRequest } from '../../models/AccessRequest';
import { hashPassword, comparePassword } from '../../utils/password';
import { signAccessToken, signRefreshToken } from '../../utils/jwt';
import { UnauthorizedError, ConflictError, NotFoundError } from '../../utils/AppError';

export class AuthService {
  static async register(data: { name: string; email: string; password: string }) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError('Email is already registered');
    }

    const passwordHash = await hashPassword(data.password);
    
    // Create user with pending status
    const user = await User.create({
      name: data.name,
      email: data.email,
      passwordHash,
      status: 'pending',
      role: 'user',
    });

    // Create an access request
    await AccessRequest.create({
      userId: user._id,
      status: 'pending',
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
    };
  }

  static async login(data: { email: string; password: string }) {
    const user = await User.findOne({ email: data.email });
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isMatch = await comparePassword(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const payload = { userId: user._id.toString(), role: user.role, status: user.status };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user._id.toString() });

    // Store refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, image: user.image },
      accessToken,
      refreshToken,
    };
  }

  static async googleLogin(data: { email: string; name: string; image?: string }) {
    let user = await User.findOne({ email: data.email });

    if (!user) {
      // Create user if not exists
      user = await User.create({
        name: data.name,
        email: data.email,
        image: data.image,
        passwordHash: await hashPassword(Math.random().toString(36).slice(-10)), // Random placeholder password
        status: 'approved', // Auto-approve Google users for now
        role: 'user',
      });
    } else if (data.image && user.image !== data.image) {
      user.image = data.image;
      // We don't save immediately here to avoid a redundant save if we also save tokens later, 
      // but let's just do it securely or wait for the token save below.
    }

    const payload = { userId: user._id.toString(), role: user.role, status: user.status };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user._id.toString() });

    user.refreshTokens.push(refreshToken);
    await user.save();

    return {
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, image: user.image },
      accessToken,
      refreshToken,
    };
  }

  static async getUsers(role?: string) {
    const filter = role && role !== 'all' ? { role } : {};
    return await User.find(filter).select('-passwordHash -refreshTokens').sort({ createdAt: -1 });
  }

  static async updateUserRole(userId: string, newRole: string) {
    if (!['user', 'admin'].includes(newRole)) {
      throw new ConflictError('Invalid role');
    }
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    
    // Check if it's the super admin
    if (user.email === 'rijoanmaruf@gmail.com') {
      throw new ConflictError('Cannot modify super admin role');
    }

    user.role = newRole as any;
    await user.save();
    return { id: user._id, name: user.name, email: user.email, role: user.role };
  }
}
