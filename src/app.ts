import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { readdirSync, promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { AppConfig, IAppConfig } from '@config/app.config.js';
import { NotFoundError } from '@errors';
import { ANSI } from '@utils/ansi.util.js';
import { Logger } from '@utils/logger.js';
import { Database } from '@database/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class App {
    private app: Express;
    private appConfig: IAppConfig;

    constructor(config: IAppConfig) {
        this.app = express();
        this.appConfig = config;

        Logger.natural(ANSI.success(`[+] Configuration loaded (${config.nodeEnv})`), { sepEnd: true });
    }

    async start(): Promise<void> {
        const server = await this.initialize();

        return new Promise((resolve) => {
            const httpServer = http.createServer(server).listen(this.appConfig.port, this.appConfig.host, () => {
                // Do
                resolve();
            });

            // Configurar timeout del servidor
            httpServer.setTimeout(30000);
            httpServer.keepAliveTimeout = 65000;
            httpServer.headersTimeout = 66000;
        });
    }

    async initialize(): Promise<Express> {
        // 1. Conexión a las bases de datos y manejo de los datos
        await this.setupDatabase();

        // 2. Middlewares básicos
        this.setupMiddlewares();

        // 3. Rutas de la API
        await this.setupRoutes();

        // 4. Manejo de errores
        this.setupErrorHandling();

        Logger.natural(ANSI.success('[+] Application initialized successfully'), { sepStart: true, sepEnd: true });
        Logger.natural(ANSI.info(`Server running on ${ANSI.link(this.appConfig.apiBaseUrl)}${ANSI.getCode('reset')}`));
        Logger.natural(ANSI.info('Waiting for requests...\n'));

        return this.app;
    }

    private setupMiddlewares(): void {
        Logger.natural(ANSI.info('-------- [ Setting up Middlewares ] --------'));

        // 1. Favicon handler (evita 404 innecesarios)
        this.app.get('/favicon.ico', (req, res) => res.status(204).end());

        // 2. Seguridad básica
        this.app.disable('x-powered-by');

        // 3. CORS
        if (this.appConfig.enableCors) {
            this.app.use(cors(this.appConfig.corsOptions));
            Logger.natural(ANSI.success('[+] CORS middleware loaded'));
        }

        // 4. Seguridad avanzada con Helmet
        if (this.appConfig.enableHelmet) {
            this.app.use(
                helmet({
                    contentSecurityPolicy: AppConfig.isProduction(),
                    crossOriginEmbedderPolicy: AppConfig.isProduction(),
                    hsts: AppConfig.isProduction(),
                }),
            );
            Logger.natural(ANSI.success('[+] Helmet middleware loaded'));
        }

        // 5. Logging de requests
        if (this.appConfig.enableMorgan) {
            const format = AppConfig.isDevelopment() ? 'dev' : 'combined';
            this.app.use(morgan(format));
            Logger.natural(ANSI.success('[+] Morgan middleware loaded'));
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
        Logger.natural(ANSI.success('[+] Body Parsing middleware loaded'));

        // 7. URL encoded parsing (para formularios)
        this.app.use(
            express.urlencoded({
                extended: true,
                limit: '10mb',
            }),
        );
        Logger.natural(ANSI.success('[+] URL Encoding Parsing middleware loaded'));

        // 8. Cookie parsing
        this.app.use(cookieParser());
        Logger.natural(ANSI.success('[+] Cookie Parsing middleware loaded'));

        // 9. Static files
        this.app.use(
            express.static('public', {
                maxAge: AppConfig.isProduction() ? '1d' : 0,
            }),
        );
        Logger.natural(ANSI.success('[+] Static Files middleware loaded'));

        Logger.natural(ANSI.info(''.padEnd(44, '-')), { sepEnd: true });
    }

    private async setupRoutes(): Promise<void> {
        Logger.natural(ANSI.info('----------- [ Setting up Routes ] ----------'));
        const router = express.Router();
        const apiPrefix = `/api/v1`;

        // Health check global
        router.get('/health', (req: Request, res: Response) => {
            const health = {
                status: 'healthy',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                environment: this.appConfig.nodeEnv,
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
                    api: `${this.appConfig.apiBaseUrl}/[module]`,
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
            Logger.error(`Loading modules`, error);
        }

        this.app.use(apiPrefix, router);

        Logger.natural(ANSI.success(`[+] All routes loaded`));
        Logger.natural(ANSI.info(''.padEnd(44, '-')));
    }

    private async loadModule(
        moduleName: string,
        modulesPath: string,
        router: express.Router,
        apiPrefix: string,
    ): Promise<void> {
        try {
            const baseRoutePath = path.join(modulesPath, moduleName, '_.route');
            let routePath: string | undefined;

            // Verificar si el archivo existe
            for (const _routePath of [baseRoutePath + '.js', baseRoutePath + '.ts']) {
                const stats = await fs.stat(_routePath).catch(() => null);
                if (stats) {
                    routePath = _routePath;
                    break;
                }
            }

            if (routePath == null) return Logger.warn(`Module ${moduleName} has no route file`);

            // Importar dinámicamente
            const routeUrl = pathToFileURL(routePath);
            const module = await import(routeUrl.toString());

            if (!module.default || typeof module.default !== 'function')
                throw new Error(`Module ${moduleName} does not export a valid router`);

            // Montar el router
            const moduleRouter = module.default;
            router.use(`/${moduleName}`, moduleRouter);

            Logger.natural(
                `Loaded: ${ANSI.link(`${this.appConfig.apiBaseUrl}${apiPrefix}/${moduleName}`)}${ANSI.getCode(
                    'reset',
                )}`,
            );
        } catch (error: any) {
            Logger.error(`Failed to load module ${moduleName}:`, error);
        }
    }

    private setupErrorHandling(): void {
        // 2. Middleware para capturar 404 de ruta
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            const error = new NotFoundError('Route', req.originalUrl);
            next(error); // Pasamos el error al manejador global
        });

        // 3. Manejador de errores global
        this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            res.status(err.statusCode || 500).json({
                message: err.userMessage || 'Internal Server Error',
            });
        });
    }

    private async setupDatabase(): Promise<void> {
        Logger.natural(ANSI.info('--------- [ Setting up Databases ] ---------'));

        await Database.initializeModels();

        Logger.natural(ANSI.info(''.padEnd(44, '-')), { sepEnd: true });
        Logger.natural(ANSI.info('------- [ Setting up Repositories ] --------'));

        await Database.initializeRepositories();

        Logger.natural(ANSI.info(''.padEnd(44, '-')), { sepEnd: true });
    }

    getExpressApp(): Express {
        return this.app;
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
        (this.app as any).router?.stack?.forEach((layer: any) => {
            extractRoutes(layer);
        });

        return routes;
    }
}
