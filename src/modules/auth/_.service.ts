import { BaseService } from '@bases/service.base.js';
import UserRepository from '@repositories/main/user.repository.js';
import { ValidationError } from '@errors';
import { BcryptUtil } from '@utils/bcrypt.util.js';
import { JWTUtil } from '@utils/jwt.util.js';
import crypto from 'crypto';

class AuthService extends BaseService {
    async signup(data: any) {
        const { name, email, password, username } = data;

        this.validateRequired(data, ['name', 'email', 'password', 'username']);

        if (!BcryptUtil.validatePasswordStrength(password)) {
            throw new ValidationError('Weak password', [
                'Password must be at least 8 characters and contain letters and numbers',
            ]);
        }

        const exists = await UserRepository.findByEmail(email);
        if (exists) throw new ValidationError('Email already registered');

        const usernameExists = await UserRepository.getOne({ username });
        if (usernameExists) throw new ValidationError('Username already taken');

        const user = await UserRepository.create({
            email,
            password: await BcryptUtil.hash(password),
            name,
            username,
            status: 1,
        });

        const token = JWTUtil.generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: 'user',
        });

        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            username: user.username,
            token,
        };
    }

    async login(data: any) {
        const { email, password } = data;

        this.validateRequired(data, ['email', 'password']);

        const user = await UserRepository.findByEmail(email);
        if (!user) throw new ValidationError('Invalid credentials');

        const isValid = await BcryptUtil.compare(password, user.password);
        if (!isValid) throw new ValidationError('Invalid credentials');

        const token = JWTUtil.generateToken({
            userId: user._id.toString(),
            email: user.email,
            role: 'user',
        });

        return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            username: user.username,
            token,
        };
    }

    async forgotPassword(data: any) {
        const { email } = data;

        this.validateRequired(data, ['email']);

        const user = await UserRepository.findByEmail(email);
        if (!user) throw new ValidationError('If an account exists, an email was sent');

        const token = crypto.randomBytes(32).toString('hex');

        await UserRepository.update(user._id.toString(), {
            resetPasswordToken: token,
            resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
        });

        return { resetToken: token };
    }

    async resetPassword(data: any) {
        const { token, password } = data;

        this.validateRequired(data, ['token', 'password']);

        if (!BcryptUtil.validatePasswordStrength(password)) {
            throw new ValidationError('Weak password', [
                'Password must be at least 8 characters and contain letters, numbers, and special characters',
            ]);
        }

        const user = await UserRepository.getOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) throw new ValidationError('Invalid or expired token');

        await UserRepository.update(user._id.toString(), {
            password: await BcryptUtil.hash(password),
            resetPasswordToken: null,
            resetPasswordExpires: null,
        });

        return { success: true };
    }
    async changePassword(userId: string, data: any) {
        const { currentPassword, newPassword } = data;

        this.validateRequired(data, ['currentPassword', 'newPassword']);

        if (!BcryptUtil.validatePasswordStrength(newPassword)) {
            throw new ValidationError('Weak password', [
                'Password must be at least 8 characters and contain letters and numbers',
            ]);
        }

        // Buscamos el usuario y pedimos explícitamente el password (select +password)
        const user = await UserRepository.findAnything(userId);

        if (!user) throw new ValidationError('User not found');

        const isMatch = await BcryptUtil.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new ValidationError('La contraseña actual es incorrecta');
        }

        user.password = await BcryptUtil.hash(newPassword);
        await user.save();

        return { success: true };
    }
}

export default new AuthService();
