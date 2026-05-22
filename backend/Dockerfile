FROM node:18-bullseye-slim

# Instalar Python 3 y FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Crear enlace simbólico de python3 a python para que yt-dlp-exec no falle en la instalación
RUN ln -s /usr/bin/python3 /usr/bin/python

# Carpeta de trabajo en el contenedor
WORKDIR /app

# Copiar el archivo package.json (y package-lock.json si existe)
COPY package*.json ./

# Instalar dependencias del backend de producción
RUN npm install --omit=dev

# Copiar el resto del código del backend
COPY . .

# Exponer el puerto del servidor
EXPOSE 5001

# Comando para iniciar el backend
CMD ["node", "server.js"]
