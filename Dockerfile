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

# Copiar el backend package.json al directorio backend
COPY backend/package*.json ./backend/

# Instalar dependencias solo para el backend
RUN cd backend && npm install --omit=dev

# Copiar todo el código del repositorio a la imagen
COPY . .

# Exponer el puerto del servidor
EXPOSE 5001

# Iniciar el backend desde la carpeta raíz ejecutando el servidor
CMD ["node", "backend/server.js"]
