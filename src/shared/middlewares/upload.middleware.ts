import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

export class UploadMiddleware {
    // Límite unificado de 20MB (coincide con el plan gratuito de ImageKit)
    private static readonly MAX_SIZE = 20 * 1024 * 1024;

    /**
     * Filtro común para validar que solo se suban imágenes
     */
    private static fileFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
        if (!file.mimetype.startsWith('image/')) {
            cb(new Error('Only image files are allowed') as any);
        } else {
            cb(null, true);
        }
    }

    /**
     * Memoria (RAM)
     * Úsalo cuando vas a subir el archivo a la nube (ImageKit) inmediatamente.
     */
    static get memory() {
        return multer({
            storage: multer.memoryStorage(),
            limits: { fileSize: this.MAX_SIZE },
            fileFilter: this.fileFilter as any,
        });
    }

    /**
     * Disco Duro
     * Úsalo cuando quieres guardar el archivo localmente en el servidor.
     * @param folder Nombre de la subcarpeta (ej: 'posts', 'avatars')
     */
    static disk(folder: string = 'temp') {
        const uploadDir = path.resolve(`uploads/${folder}`);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const storage = multer.diskStorage({
            destination: (_req, _file, cb) => cb(null, uploadDir),
            filename: (_req, file, cb) => {
                const ext = path.extname(file.originalname);
                cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
            },
        });

        return multer({
            storage,
            limits: { fileSize: this.MAX_SIZE },
            fileFilter: this.fileFilter as any,
        });
    }
}
