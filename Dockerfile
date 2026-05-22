FROM node:18-bullseye-slim

# Instalar Python 3 y FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Crear enlace simbólico de python3 a python para que yt-dlp-exec no falle
RUN ln -s /usr/bin/python3 /usr/bin/python

# Carpeta de trabajo en el contenedor
WORKDIR /app

# Copiar archivos de dependencias de la raíz
COPY package*.json ./

# Instalar dependencias de producción de la raíz (incluye express, redis y yt-dlp-exec)
RUN npm install --omit=dev

# Copiar todo el código del repositorio a la imagen
COPY . .

# Exponer el puerto del servidor
EXPOSE 5001

# Iniciar el backend ejecutando el archivo server.js que está dentro de backend/
CMD ["node", "backend/server.js"]
