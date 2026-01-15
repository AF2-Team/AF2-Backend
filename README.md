# AF2-Backend
Backend del proyecto AF2

## Requisitos
- Node.js en su última versión 24 LTS 
- MongoDB en ejecución local o acceso a una instancia remota

## Instalación
1. Clona el repositorio:
   #### HTTPS:
   ```bash
   git clone https://github.com/AF2-Team/AF2-Backend.git
   ```
   #### SSH:
   ```bash
   git clone git@github.com:AF2-Team/AF2-Backend.git
   ```
2. Ingresa a la carpeta del proyecto:
   ```bash
   cd af2-backend
   ```
3. Instala las dependencias:
   ```bash
   yarn install
   ```
4. Configura las variables de entorno estableciéndolas en el archivo `.env` siguiendo el ejemplo proporcionado en el archivo .env.example.
5. Genera el build del proyecto:
   ```bash
   yarn build
   ```
## Uso
1. Inicia el servidor
   #### En modo producción:
   ```bash
   yarn start
   ```
   #### En modo desarrollo:
   ```bash
   yarn dev
   ```
2. El servidor estará disponible en el puerto configurado (el que definas en el archivo de entorno o en su defecto el que el SO asigne) bajo el host establecido también.
