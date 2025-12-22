import bcrypt from 'bcryptjs';

export class BcryptUtil {
    private static readonly SALT_ROUNDS: number = 10;

    static async hash(password: string): Promise<string> {
        try {
            const salt = await bcrypt.genSalt(this.SALT_ROUNDS);

            return bcrypt.hash(password, salt);
        } catch (error) {
            throw new Error(`Error hashing password: ${error}`);
        }
    }

    static async compare(password: string, hash: string): Promise<boolean> {
        try {
            return bcrypt.compare(password, hash);
        } catch (error) {
            throw new Error(`Error comparing passwords: ${error}`);
        }
    }

    static validatePasswordStrength(password: string): boolean {
        const minLength = password.length >= 6;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);

        return minLength && hasLetter && hasNumber;
    }

    static generateRandomPassword(length: number = 12): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';

        for (let i = 0; i < length; i++) password += chars.charAt(Math.floor(Math.random() * chars.length));

        return password;
    }
}
