const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Image compression and processing utility
class ImageProcessor {
  constructor() {
    this.maxWidth = 1920;
    this.maxHeight = 1080;
    this.thumbnailSize = 300;
    this.quality = 85;
  }

  /**
   * Compress and optimize an image
   * @param {string} inputPath - Path to the original image
   * @param {string} outputPath - Path where compressed image will be saved
   * @param {Object} options - Compression options
   */
  async compressImage(inputPath, outputPath, options = {}) {
    try {
      const {
        maxWidth = this.maxWidth,
        maxHeight = this.maxHeight,
        quality = this.quality,
        format = 'jpeg'
      } = options;

      let pipeline = sharp(inputPath);
      
      // Get original image metadata
      const metadata = await pipeline.metadata();
      console.log(`📸 Processing image: ${metadata.width}x${metadata.height}, ${metadata.format}, ${Math.round(metadata.size / 1024)}KB`);

      // Resize if image is too large
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        pipeline = pipeline.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert and compress based on format
      if (format === 'jpeg' || format === 'jpg') {
        pipeline = pipeline.jpeg({ 
          quality,
          progressive: true,
          mozjpeg: true
        });
      } else if (format === 'png') {
        pipeline = pipeline.png({ 
          quality,
          compressionLevel: 8,
          progressive: true
        });
      } else if (format === 'webp') {
        pipeline = pipeline.webp({ 
          quality,
          effort: 6
        });
      }

      // Save compressed image
      await pipeline.toFile(outputPath);

      // Get compressed file stats
      const stats = await fs.stat(outputPath);
      const compressedMetadata = await sharp(outputPath).metadata();
      
      console.log(`✅ Image compressed: ${compressedMetadata.width}x${compressedMetadata.height}, ${Math.round(stats.size / 1024)}KB`);
      
      return {
        success: true,
        originalSize: metadata.size,
        compressedSize: stats.size,
        dimensions: {
          width: compressedMetadata.width,
          height: compressedMetadata.height
        },
        compressionRatio: ((metadata.size - stats.size) / metadata.size * 100).toFixed(2)
      };

    } catch (error) {
      console.error('❌ Image compression failed:', error);
      throw new Error(`Image compression failed: ${error.message}`);
    }
  }

  /**
   * Generate thumbnail for an image
   * @param {string} inputPath - Path to the original image
   * @param {string} thumbnailPath - Path where thumbnail will be saved
   * @param {number} size - Thumbnail size (default: 300px)
   */
  async generateThumbnail(inputPath, thumbnailPath, size = this.thumbnailSize) {
    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'centre'
        })
        .jpeg({
          quality: 80,
          progressive: true
        })
        .toFile(thumbnailPath);

      console.log(`🖼️ Thumbnail generated: ${thumbnailPath}`);
      
      const stats = await fs.stat(thumbnailPath);
      return {
        success: true,
        thumbnailPath,
        size: stats.size
      };

    } catch (error) {
      console.error('❌ Thumbnail generation failed:', error);
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  /**
   * Extract video thumbnail (requires ffmpeg - for future implementation)
   * @param {string} videoPath - Path to the video file
   * @param {string} thumbnailPath - Path where thumbnail will be saved
   */
  async generateVideoThumbnail(videoPath, thumbnailPath) {
    // This would require ffmpeg integration
    // For now, we'll create a placeholder
    try {
      // Create a simple placeholder image for video thumbnails
      await sharp({
        create: {
          width: 300,
          height: 200,
          channels: 4,
          background: { r: 139, g: 74, b: 74, alpha: 1 }
        }
      })
      .png()
      .composite([{
        input: Buffer.from(`
          <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="30" fill="white" opacity="0.8"/>
            <polygon points="40,35 65,50 40,65" fill="#4a1e2c"/>
          </svg>
        `),
        top: 50,
        left: 100
      }])
      .toFile(thumbnailPath);

      console.log(`🎬 Video thumbnail placeholder generated: ${thumbnailPath}`);
      
      const stats = await fs.stat(thumbnailPath);
      return {
        success: true,
        thumbnailPath,
        size: stats.size,
        isPlaceholder: true
      };

    } catch (error) {
      console.error('❌ Video thumbnail generation failed:', error);
      throw new Error(`Video thumbnail generation failed: ${error.message}`);
    }
  }

  /**
   * Get image metadata without processing
   * @param {string} imagePath - Path to the image
   */
  async getImageInfo(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = await fs.stat(imagePath);
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: stats.size,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density
      };

    } catch (error) {
      console.error('❌ Failed to get image info:', error);
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }

  /**
   * Process uploaded image with compression and thumbnail generation
   * @param {Object} file - Multer file object
   * @param {Object} options - Processing options
   */
  async processUploadedImage(file, options = {}) {
    try {
      const inputPath = file.path;
      const ext = path.extname(file.filename);
      const nameWithoutExt = path.basename(file.filename, ext);
      const dir = path.dirname(inputPath);
      
      // Paths for processed files
      const compressedPath = path.join(dir, `${nameWithoutExt}_compressed${ext}`);
      const thumbnailPath = path.join('uploads/thumbnails', `${nameWithoutExt}_thumb.jpg`);
      
      // Process original image
      const compressionResult = await this.compressImage(inputPath, compressedPath, options);
      
      // Generate thumbnail
      const thumbnailResult = await this.generateThumbnail(compressedPath, thumbnailPath);
      
      // Remove original uncompressed file
      await fs.unlink(inputPath);
      
      // Rename compressed file to original name
      await fs.rename(compressedPath, inputPath);
      
      return {
        success: true,
        compression: compressionResult,
        thumbnail: thumbnailResult,
        finalPath: inputPath,
        thumbnailUrl: `/uploads/thumbnails/${path.basename(thumbnailPath)}`
      };

    } catch (error) {
      console.error('❌ Image processing failed:', error);
      throw error;
    }
  }
}

module.exports = new ImageProcessor();