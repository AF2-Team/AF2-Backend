import mongoose, { Connection, ConnectOptions } from 'mongoose';
import { Logger } from '../shared/utils/logger';

export class Database {
    private static instance: Database;
    private isConnected: boolean = false;
    private connection: Connection | null = null;

    private constructor() {}

    static getInstance(): Database {
        if (!Database.instance) Database.instance = new Database();

        return Database.instance;
    }

    async connect(): Promise<void> {
        if (this.isConnected) {
            Logger.info('Database already connected');

            return;
        }

        try {
            const mongoUri: string | undefined = process.env.MONGODB_URI;

            if (mongoUri == undefined) throw new Error('<mongoUri> was no provided');

            const options: ConnectOptions = {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            };

            await mongoose.connect(mongoUri, options);

            this.connection = mongoose.connection;
            this.isConnected = true;
            Logger.info('✅ MongoDB connected successfully');

            this.setupEventListeners();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            Logger.error('❌ MongoDB connection failed:', errorMessage);
            process.exit(1);
        }
    }

    private setupEventListeners(): void {
        if (!this.connection) return;

        this.connection.on('error', (error: Error) => {
            Logger.error('MongoDB connection error:', error.message);
            this.isConnected = false;
        });

        this.connection.on('disconnected', () => {
            Logger.warn('MongoDB disconnected');
            this.isConnected = false;
        });

        this.connection.on('reconnected', () => {
            Logger.info('MongoDB reconnected');
            this.isConnected = true;
        });

        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    async disconnect(): Promise<void> {
        if (!this.isConnected || !this.connection) return;

        try {
            await mongoose.disconnect();
            this.isConnected = false;
            this.connection = null;
            Logger.info('MongoDB disconnected successfully');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Logger.error('Error disconnecting MongoDB:', errorMessage);
        }
    }

    getConnectionStatus(): boolean {
        return this.isConnected;
    }

    getConnection(): Connection | null {
        return this.connection;
    }

    async ping(): Promise<boolean> {
        if (!this.connection) return false;

        try {
            await this.connection.db.command({ ping: 1 });

            return true;
        } catch {
            return false;
        }
    }
}

export const database = Database.getInstance();
