const dotenv = require('dotenv');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const s3ClientConfig = {
  region: process.env.AWS_REGION || 'eu-north-1'
};

// In development, use credentials from environment variables
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

const s3Client = new S3Client(s3ClientConfig);

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'mediblues';

/**
 * Upload image to S3
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} fileName - Original file name
 * @param {string} folder - Folder in S3 (e.g., 'banners', 'doctors', 'departments')
 * @returns {Promise<string>} S3 URL of uploaded image
 */
const uploadToS3 = async (fileBuffer, fileName, folder) => {
  try {
    // Generate unique file name to avoid conflicts
    const fileExtension = fileName.split('.').pop();
    const uniqueName = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueName,
      Body: fileBuffer,
      ContentType: getContentType(fileExtension)
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Return CloudFront URL if configured, otherwise S3 URL
    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
    console.log('CloudFront domain from env:', cloudFrontDomain);
    let imageUrl;
    
    if (cloudFrontDomain) {
      // Use CloudFront URL
      imageUrl = `https://${cloudFrontDomain}/${uniqueName}`;
      console.log('Generated CloudFront URL:', imageUrl);
    } else {
      // Fallback to direct S3 URL
      imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${uniqueName}`;
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload image to S3: ${error.message}`);
  }
};

/**
 * Get content type based on file extension
 */
const getContentType = (extension) => {
  const contentTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return contentTypes[extension.toLowerCase()] || 'image/jpeg';
};

/**
 * Delete image from S3
 * @param {string} s3Url - S3 URL of the image
 */
const deleteFromS3 = async (s3Url) => {
  try {
    // Extract key from S3 URL
    const urlParts = s3Url.split(`${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/`);
    if (urlParts.length !== 2) {
      throw new Error('Invalid S3 URL format');
    }

    const key = urlParts[1];

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    console.log(`Deleted S3 object: ${key}`);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error(`Failed to delete image from S3: ${error.message}`);
  }
};

module.exports = { uploadToS3, deleteFromS3, s3Client };
