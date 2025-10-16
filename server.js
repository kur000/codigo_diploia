// 1. Importar las librerías
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors'); // Para permitir peticiones desde tu web
const path = require('path');

const app = express();
app.use(cors()); // Habilita CORS

// Sirve el sitio estático (index.html, main.js, style.css, images/)
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 2. Configurar Cloudinary con tus credenciales - API para subir imagenes a la nube
cloudinary.config({
  cloud_name: 'ddtecuoe9',
  api_key: '585716652291527',
  api_secret: 'C8fnGrOkI09nvetm5hKwfjCCHpo',
});

// 3. Configurar Multer para que guarde el archivo en memoria temporalmente
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 4. Crear la ruta (endpoint) para la subida de archivos
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo.' });
  }
  cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
    if (error) {
      console.error('Error en Cloudinary:', error);
      return res.status(500).json({ error: 'Error al subir la imagen.' });
    }
    res.status(200).json({ imageUrl: result.secure_url });
  }).end(req.file.buffer);
});

// 5. Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});