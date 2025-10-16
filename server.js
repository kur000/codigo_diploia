// 1. Importar las librerías
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors'); // Para permitir peticiones desde tu web
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());

// Serve static site and add a health check
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/health', (req, res) => res.json({ ok: true }));

// Cloudinary config (prefer env vars; falls back to placeholders)
cloudinary.config({
  cloud_name: 'ddtecuoe9',
  api_key: '585716652291527',
  api_secret: 'C8fnGrOkI09nvetm5hKwfjCCHpo',
});

// MongoDB Atlas connection
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://kuro_db:kuroDB@clusterdiplo.feaioyc.mongodb.net/?retryWrites=true&w=majority&appName=ClusterDiplo';
mongoose.connect(MONGO_URI, {
  dbName: 'maqueta3js',          // ensure a concrete DB name
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => console.log('MongoDB Atlas connected'));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));

// Image model
const Image = mongoose.model('Image', new mongoose.Schema({
  url: { type: String, required: true },
  public_id: String,
  originalName: String,
  format: String,
  width: Number,
  height: Number,
  createdAt: { type: Date, default: Date.now },
}));

// Multer in-memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper: await Cloudinary upload_stream
function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    }).end(buffer);
  });
}

// Upload route: save to Cloudinary + MongoDB
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo.' });

  try {
    const result = await uploadBufferToCloudinary(req.file.buffer);
    const doc = await Image.create({
      url: result.secure_url,
      public_id: result.public_id,
      originalName: req.file.originalname,
      format: result.format,
      width: result.width,
      height: result.height,
    });
    res.status(200).json({ imageUrl: result.secure_url, id: doc._id });
  } catch (err) {
    console.error('Error en Cloudinary o DB:', err);
    res.status(500).json({ error: 'Error al subir/guardar la imagen.' });
  }
});

// Listing route
app.get('/api/images', async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 }).lean();
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar las imágenes.' });
  }
});

// 5. Iniciar el servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});