import { App } from './app.js';
import { Config } from '@config/app.config.js';

async function bootstrap() {
    try {
        // Cargar configuración
        const config = Config.load();
        console.log(`  [+] Configuration loaded (${config.nodeEnv})\n`);

        // Crear aplicación
        const app = new App(config);

        // Manejar shutdown
        setupGracefulShutdown(app);

        // Iniciar servidor
        await app.start();
    } catch (error) {
        console.error('  [X] Failed to start application:', error);
        process.exit(1);
    }
}

function setupGracefulShutdown(app: any) {
    const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];

    signals.forEach((signal) => {
        process.on(signal, async () => {
            console.log(`\n${signal} received, starting graceful shutdown...`);
            console.log('  [+] Application shutdown complete');
            process.exit(0);
        });
    });

    // Errores no capturados
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
}

// Iniciar la aplicación
bootstrap();
