const dotenv = require('dotenv');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const s3ClientConfig = {
  region: process.env.AWS_REGION || 'eu-north-1',
  // Optimize for Lambda - fail fast on timeouts
  maxAttempts: 2,
  requestTimeout: 8000, // 8 second timeout for S3 operations
  connectionTimeout: 2000, // 2 second connection timeout
  retryMode: 'adaptive'
};

// In Lambda, credentials are automatically provided via IAM role
// Only set explicit credentials in local development
if (process.env.NODE_ENV === 'development' && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3ClientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
  console.log('Using explicit AWS credentials from environment');
} else {
  console.log('Using IAM role credentials (Lambda execution role)');
}

// Lazy initialization to reduce cold start time
let s3Client = null;

const getS3Client = () => {
  if (!s3Client) {
    console.log('Initializing S3 client with config:', {
      region: s3ClientConfig.region,
      requestTimeout: s3ClientConfig.requestTimeout,
      hasExplicitCredentials: !!s3ClientConfig.credentials
    });
    s3Client = new S3Client(s3ClientConfig);
  }
  return s3Client;
};

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
    console.log('Starting S3 upload:', { fileName, folder, fileSize: fileBuffer.length });
    
    // Generate unique file name to avoid conflicts
    const fileExtension = fileName.split('.').pop();
    const uniqueName = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueName,
      Body: fileBuffer,
      ContentType: getContentType(fileExtension)
    };

    console.log('Upload params:', { bucket: BUCKET_NAME, key: uniqueName });

    // Get client instance
    const client = getS3Client();
    console.log('Sending PutObjectCommand to S3...');
    
    // Create a timeout promise to fail faster than Lambda timeout
    const uploadTimeout = 20000; // 20 second timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('S3 upload timed out after 20 seconds')), uploadTimeout);
    });
    
    // Race between upload and timeout
    const command = new PutObjectCommand(uploadParams);
    await Promise.race([
      client.send(command),
      timeoutPromise
    ]);
    
    console.log('S3 upload completed successfully');

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
      console.log('Generated S3 URL:', imageUrl);
    }
    
    return imageUrl;
  } catch (error) {
    console.error('Error uploading to S3:', {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode
    });
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

    const client = getS3Client();
    await client.send(command);
    console.log(`Deleted S3 object: ${key}`);
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error(`Failed to delete image from S3: ${error.message}`);
  }
};

module.exports = { uploadToS3, deleteFromS3, getS3Client };
