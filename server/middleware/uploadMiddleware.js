const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Create uploads directory if it doesn't exist
const createUploadsDir = async () => {
  const uploadDirs = [
    'uploads',
    'uploads/images',
    'uploads/audio',
    'uploads/video', 
    'uploads/files',
    'uploads/voice',
    'uploads/thumbnails'
  ];

  for (const dir of uploadDirs) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }
};

// Initialize directories
createUploadsDir();

// File type validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm'],
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
    voice: ['audio/webm', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/mpeg'], // Voice recordings
    file: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ]
  };

  // Get upload type from the middleware function (set by createUploadMiddleware)
  const uploadType = req.uploadType;
  
  if (!uploadType || !allowedTypes[uploadType]) {
    return cb(new Error('Invalid upload type specified'), false);
  }

  const isAllowed = allowedTypes[uploadType].includes(file.mimetype);
  
  if (!isAllowed) {
    return cb(new Error(`File type ${file.mimetype} not allowed for ${uploadType} uploads`), false);
  }

  cb(null, true);
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.uploadType;
    
    let folder = 'uploads/files'; // default
    
    switch (uploadType) {
      case 'image':
        folder = 'uploads/images';
        break;
      case 'audio':
        folder = 'uploads/audio';
        break;
      case 'voice':
        folder = 'uploads/voice';
        break;
      case 'video':
        folder = 'uploads/video';
        break;
      case 'file':
      default:
        folder = 'uploads/files';
        break;
    }
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    
    // Create a unique filename: timestamp_uuid_originalname
    const filename = `${timestamp}_${uniqueId}${ext}`;
    cb(null, filename);
  }
});

// File size limits (in bytes)
const limits = {
  image: 5 * 1024 * 1024,    // 5MB for images
  audio: 10 * 1024 * 1024,   // 10MB for audio
  video: 50 * 1024 * 1024,   // 50MB for video
  file: 25 * 1024 * 1024,    // 25MB for documents
  voice: 5 * 1024 * 1024     // 5MB for voice messages
};

// Create multer instance
const createMulterInstance = (uploadType) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: limits[uploadType] || limits.file
    }
  });
};

// Middleware factory for different upload types
const createUploadMiddleware = (uploadType) => {
  return (req, res, next) => {
    // Set the upload type in request for later use
    req.uploadType = uploadType;
    
    // Create multer instance for this upload type
    const upload = createMulterInstance(uploadType);
    
    // Use single file upload
    upload.single('file')(req, res, (err) => {
      if (err) {
        console.error(`❌ Upload error for ${uploadType}:`, err);
        
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: `File too large. Maximum size for ${uploadType} is ${limits[uploadType] / (1024 * 1024)}MB`
            });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
              success: false,
              message: 'Unexpected file field. Use "file" as the field name.'
            });
          }
        }
        
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed'
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      console.log(`✅ File uploaded successfully for ${uploadType}:`, {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
      
      next();
    });
  };
};

// Helper function to get file info
const getFileInfo = (file, uploadType) => {
  let folder;
  switch (uploadType) {
    case 'image':
      folder = 'images';
      break;
    case 'audio':
      folder = 'audio';
      break;
    case 'voice':
      folder = 'voice';
      break;
    case 'video':
      folder = 'video';
      break;
    case 'file':
    default:
      folder = 'files';
      break;
  }

  return {
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimeType: file.mimetype,
    uploadType,
    url: `/uploads/${folder}/${file.filename}`
  };
};

// Cleanup function for removing files
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log(`🗑️ Deleted file: ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to delete file ${filePath}:`, error.message);
  }
};

module.exports = {
  createUploadMiddleware,
  getFileInfo,
  deleteFile,
  limits
};