import { successResponse, errorResponse } from '../utils/response.js';
import { query } from '../utils/database.js';

/**
 * GET /banners - Get all banners
 */
export const getBanners = async (event) => {
  try {
    const results = await query('SELECT * FROM banners ORDER BY createdAt DESC');
    return successResponse(results);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return errorResponse('Failed to fetch banners', 500);
  }
};

/**
 * GET /banners/{id} - Get single banner
 */
export const getBanner = async (event) => {
  try {
    const { id } = event.pathParameters;
    const results = await query('SELECT * FROM banners WHERE id = ?', [id]);
    
    if (results.length === 0) {
      return errorResponse('Banner not found', 404);
    }
    
    return successResponse(results[0]);
  } catch (error) {
    console.error('Error fetching banner:', error);
    return errorResponse('Failed to fetch banner', 500);
  }
};

/**
 * POST /banners - Create new banner
 */
export const createBanner = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { title, description, imageUrl, dimensions, size } = body;

    if (!title || !imageUrl) {
      return errorResponse('Title and imageUrl are required', 400);
    }

    const uploadDate = new Date().toISOString().split('T')[0];

    const result = await query(
      'INSERT INTO banners (title, description, imageUrl, dimensions, size, uploadDate, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        title,
        description || null,
        imageUrl,
        dimensions || null,
        size || null,
        uploadDate,
        true
      ]
    );

    return successResponse({ 
      id: result.insertId,
      ...body,
      uploadDate,
      isActive: true
    }, 201);
  } catch (error) {
    console.error('Error creating banner:', error);
    return errorResponse('Failed to create banner', 500);
  }
};

/**
 * PUT /banners/{id} - Update banner
 */
export const updateBanner = async (event) => {
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body || '{}');

    // Check if banner exists
    const existing = await query('SELECT * FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse('Banner not found', 404);
    }

    const { title, description, imageUrl, dimensions, size, isActive } = body;
    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) { updateFields.push('title = ?'); updateValues.push(title); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (imageUrl !== undefined) { updateFields.push('imageUrl = ?'); updateValues.push(imageUrl); }
    if (dimensions !== undefined) { updateFields.push('dimensions = ?'); updateValues.push(dimensions); }
    if (size !== undefined) { updateFields.push('size = ?'); updateValues.push(size); }
    if (isActive !== undefined) { updateFields.push('isActive = ?'); updateValues.push(isActive); }

    if (updateFields.length === 0) {
      return errorResponse('No fields to update', 400);
    }

    updateValues.push(id);
    await query(`UPDATE banners SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

    return successResponse({ id, ...body });
  } catch (error) {
    console.error('Error updating banner:', error);
    return errorResponse('Failed to update banner', 500);
  }
};

/**
 * DELETE /banners/{id} - Delete banner
 */
export const deleteBanner = async (event) => {
  try {
    const { id } = event.pathParameters;

    // Check if banner exists
    const existing = await query('SELECT * FROM banners WHERE id = ?', [id]);
    if (existing.length === 0) {
      return errorResponse('Banner not found', 404);
    }

    await query('DELETE FROM banners WHERE id = ?', [id]);
    return successResponse({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return errorResponse('Failed to delete banner', 500);
  }
};
