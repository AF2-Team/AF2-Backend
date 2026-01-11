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

    /**
     *Genera parámetros de autenticación para subida directa desde el móvil
     */
    static getAuthParams() {
        return ik.helper.getAuthenticationParameters();
    }
}
