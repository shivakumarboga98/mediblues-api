const { uploadToS3 } = require('../utils/s3.js');
const { successResponse, errorResponse } = require('../utils/response.js');

/**
 * Upload image to S3 and return the URL
 * Expects multipart form data with:
 * - file: image file
 * - folder: folder name (banners, doctors, departments)
 */
const uploadImage = async (event) => {
  try {
    console.log('Upload request received:', {
      folder: event.queryStringParameters?.folder,
      filename: event.queryStringParameters?.filename,
      hasBody: !!event.body,
      isBase64Encoded: event.isBase64Encoded
    });

    // Get request body - it's base64 encoded string
    let body = event.body;

    if (!body) {
      return errorResponse('No file provided', 400);
    }

    // Body is base64 string from frontend
    // If serverless encoded it again, decode it first
    if (event.isBase64Encoded) {
      body = Buffer.from(body, 'base64').toString('utf-8');
    }

    // Now body is the base64 string from frontend
    const binaryBody = Buffer.from(body, 'base64');

    // Get folder from query parameters
    const folder = event.queryStringParameters?.folder || 'uploads';

    // Get filename from query parameters (passed by frontend)
    let filename = event.queryStringParameters?.filename || `image-${Date.now()}`;
    // URL decode the filename in case it was encoded
    try {
      filename = decodeURIComponent(filename);
    } catch (e) {
      // If decoding fails, use as is
    }

    // Validate file size (5MB limit)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (binaryBody.length > MAX_FILE_SIZE) {
      return errorResponse('File size exceeds 5MB limit', 413);
    }

    // Validate file type
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const fileExtension = filename.split('.').pop().toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      return errorResponse('Invalid file type. Only images are allowed.', 400);
    }

    // Upload to S3
    const s3Url = await uploadToS3(binaryBody, filename, folder);

    console.log('Image uploaded successfully:', {
      url: s3Url,
      filename: filename,
      folder: folder
    });

    return successResponse({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: s3Url,
        filename: filename,
        folder: folder
      }
    }, 200);
  } catch (error) {
    console.error('Error uploading image:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    const response = errorResponse(error.message, 500);
    // Add CORS headers
    response.headers = {
      ...response.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    return response;
  }
};

module.exports.uploadImage = uploadImage;
