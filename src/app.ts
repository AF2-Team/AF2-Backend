import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { AppConfig, Config } from '@config/app.config.js';
import { AppError, NotFoundError, UnknownError } from '@errors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class App {
    private app: Express;
    private config: AppConfig;

    constructor(config: AppConfig) {
        this.app = express();
        this.config = config;
    }

    async initialize(): Promise<Express> {
        console.log('  [~] Initializing application...\n');

        // 1. Middlewares básicos
        this.setupMiddlewares();

        // 2. Rutas de la API
        await this.setupRoutes();

        // 3. Manejo de errores
        this.setupErrorHandling();

        console.log('  [+] Application initialized\n');
        return this.app;
    }

    private setupMiddlewares(): void {
        console.log('  [~] Setting up middlewares...');

        // 1. Favicon handler (evita 404 innecesarios)
        this.app.get('/favicon.ico', (req, res) => res.status(204).end());

        // 2. Seguridad básica
        this.app.disable('x-powered-by');

        // 3. CORS
        if (this.config.enableCors) this.app.use(cors(this.config.corsOptions));

        // 4. Seguridad avanzada con Helmet
        if (this.config.enableHelmet) {
            this.app.use(
                helmet({
                    contentSecurityPolicy: Config.isProduction(),
                    crossOriginEmbedderPolicy: Config.isProduction(),
                    hsts: Config.isProduction(),
                }),
            );
        }

        // 5. Logging de requests
        if (this.config.enableMorgan) {
            const format = Config.isDevelopment() ? 'dev' : 'combined';
            this.app.use(morgan(format));
        }

        // 6. Body parsing
        this.app.use(
            express.json({
                limit: '10mb',
                verify: (req: any, res, buf) => {
                    req.rawBody = buf.toString();
                },
            }),
        );

        // 7. URL encoded parsing (para formularios)
        this.app.use(
            express.urlencoded({
                extended: true,
                limit: '10mb',
            }),
        );

        // 8. Cookie parsing
        this.app.use(cookieParser());

        // 9. Static files
        this.app.use(
            express.static('public', {
                maxAge: Config.isProduction() ? '1d' : 0,
            }),
        );

        console.log('  [+] Middlewares loaded\n');
    }

    private async setupRoutes(): Promise<void> {
        console.log('  [~] Setting up routes...');

        const router = express.Router();
        const apiPrefix = `/api/v1`;

        // Health check global
        router.get('/health', (req: Request, res: Response) => {
            const health = {
                status: 'healthy',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                environment: this.config.nodeEnv,
            };

            res.json(health);
        });

        // Ready check
        router.get('/ready', (req: Request, res: Response) => {
            res.json({ status: 'ready' });
        });

        // Ruta raíz con información de la API
        router.get('/', (req: Request, res: Response) => {
            const welcome = {
                message: '🚀 Welcome to the API',
                documentation: 'See /./health for service status',
                endpoints: {
                    ready: '/ready',
                    health: '/./health',
                    api: `${this.config.apiBaseUrl}/[module]`,
                },
            };

            res.json(welcome);
        });

        // Ruta para mostrar todos los endpoints disponibles
        router.get('/endpoints', (req: Request, res: Response) => {
            const routes = this.getRoutes();

            res.json({
                endpoints: routes,
            });
        });

        // Cargar módulos dinámicamente
        const modulesPath = path.join(__dirname, 'modules');

        try {
            const moduleNames = readdirSync(modulesPath, { withFileTypes: true })
                .filter((dirent) => dirent.isDirectory())
                .map((dirent) => dirent.name);

            for (const moduleName of moduleNames) await this.loadModule(moduleName, modulesPath, router, apiPrefix);
        } catch (error: any) {
            console.error('  --[X] Error loading modules:', error.message);
        }

        this.app.use(apiPrefix, router);

        console.log('  [+] Routes loaded\n');
    }

    private async loadModule(
        moduleName: string,
        modulesPath: string,
        router: express.Router,
        apiPrefix: string,
    ): Promise<void> {
        try {
            const routePath = path.join(modulesPath, moduleName, '_.route.ts');

            // Verificar si el archivo existe
            const stats = await import('fs/promises').then((fs) => fs.stat(routePath).catch(() => null));
            if (!stats) {
                console.warn(`[-] Module ${moduleName} has no route file`);
                return;
            }

            // Importar dinámicamente
            const routeUrl = pathToFileURL(routePath);
            const module = await import(routeUrl.toString());

            if (!module.default || typeof module.default !== 'function')
                throw new Error(`Module ${moduleName} does not export a valid router`);

            // Montar el router
            const moduleRouter = module.default;
            router.use(`/${moduleName}`, moduleRouter);

            console.log(`     >> + Loaded Module: ${this.config.apiBaseUrl}${apiPrefix}/${moduleName}`);
        } catch (error: any) {
            console.error(`  --[X] Failed to load module ${moduleName}:`, error.message);

            // En desarrollo, mostrar más detalles
            if (Config.isDevelopment()) {
                console.error('Stack:', error.stack);
            }
        }
    }

    private getRoutes(): any[] {
        const routes: any[] = [];

        // Helper para extraer rutas del stack
        const extractRoutes = (layer: any, path: string = '') => {
            if (layer.route) {
                // Es una ruta directa
                const methods = Object.keys(layer.route.methods)
                    .filter((method) => layer.route.methods[method])
                    .map((method) => method.toUpperCase());

                routes.push({
                    path: path + layer.route.path,
                    methods,
                    type: 'route',
                });
            } else if (layer.name === 'router' || layer.regexp) {
                // Es un router montado
                const routerPath = path + (layer.regexp?.source?.replace(/\\\//g, '/').replace(/[^\/]*$/, '') || '');

                if (layer.handle?.stack) {
                    layer.handle.stack.forEach((sublayer: any) => {
                        extractRoutes(sublayer, routerPath);
                    });
                }
            }
        };

        // Extraer rutas del stack de Express
        (this.app as any)._router?.stack?.forEach((layer: any) => {
            extractRoutes(layer);
        });

        return routes;
    }

    private setupErrorHandling(): void {
        // 2. Middleware para capturar 404 de ruta
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            const error = new NotFoundError('Route', req.originalUrl);
            next(error); // Pasamos el error al manejador global
        });

        // 3. Manejador de errores global
        this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            res.status(err.status || 500).json({
                message: err.message || 'Internal Server Error',
            });
        });
    }

    async start(): Promise<void> {
        const server = await this.initialize();

        return new Promise((resolve) => {
            const httpServer = http.createServer(server).listen(this.config.port, this.config.host, () => {
                // Do
                resolve();
            });

            // Configurar timeout del servidor
            httpServer.setTimeout(30000);
            httpServer.keepAliveTimeout = 65000;
            httpServer.headersTimeout = 66000;
        });
    }

    getExpressApp(): Express {
        return this.app;
    }
}
