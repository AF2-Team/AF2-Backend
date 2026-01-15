import ImageKit, { toFile } from '@imagekit/nodejs';

const ik = new ImageKit({
    //publicKey: process.env.IMAGEKIT_PUBLIC_KEY || '',
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
    //urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export class ImageKitService {
    /**
     *  Sube un archivo a ImageKit desde un buffer 
     */
    static async upload(file: Express.Multer.File, folder: string = 'posts') {
        try {
            const fileForUpload = await toFile(file.buffer, file.originalname, { type: file.mimetype });
            const response = await ik.files.upload({
                file: fileForUpload,
                fileName: `${Date.now()}-${file.originalname}`,
                folder: folder,
                useUniqueFileName: true,
            });

            return response;
        } catch (error) {
            console.error('ImageKit Upload Error:', error);
            throw error;
        }
    }
   
    static async delete(fileId: string) {
        try {
            await ik.files.delete(fileId);
        } catch (error) {
            // No lanzamos error para no detener el flujo si la imagen ya no existe
            console.warn('ImageKit Delete Warning:', error);
        }
    }

    /**
     * Valida si el archivo es una imagen real verificando sus magic bytes
     */
    static isValidImage(file: Express.Multer.File): boolean {
        if (!file || !file.buffer) return false;

        // Leemos los primeros 12 bytes para cubrir JPG, PNG, GIF y WEBP
        const header = file.buffer.toString('hex', 0, 12).toLowerCase();

        const isJpg = header.startsWith('ffd8ff');
        const isPng = header.startsWith('89504e47');
        const isGif = header.startsWith('47494638');
        // WebP: Empieza con RIFF (52494646) ... y tiene WEBP (57454250) en el offset 8
        const isWebP = header.startsWith('52494646') && header.substring(16, 24) === '57454250';

        return isJpg || isPng || isGif || isWebP;
    }

    /**
     *Genera parámetros de autenticación para subida directa desde el móvil
     */
    static getAuthParams() {
        return ik.helper.getAuthenticationParameters();
    }
}
