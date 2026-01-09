import { successResponse, errorResponse } from '../utils/response.js';
import { Banner } from '../models/index.js';

/**
 * GET /banners - Get all banners
 */
export const getBanners = async (event) => {
  try {
    const banners = await Banner.findAll({
      attributes: ['id', 'title', 'description', 'image', 'link', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    return successResponse(banners);
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
    
    const banner = await Banner.findByPk(id);
    
    if (!banner) {
      return errorResponse('Banner not found', 404);
    }
    
    return successResponse(banner);
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
    const { title, description, image, link } = body;

    if (!title || !image) {
      return errorResponse('Title and image are required', 400);
    }

    const banner = await Banner.create({
      title,
      description: description || null,
      image,
      link: link || null
    });

    return successResponse({ 
      id: banner.id,
      ...banner.dataValues
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
    // Get ID from path parameter or request body
    let id = event.pathParameters?.id;
    let body = JSON.parse(event.body || '{}');
    
    // If ID not in path, it should be in the body
    if (!id && body.id) {
      id = body.id;
    }

    if (!id) {
      return errorResponse('Banner ID is required', 400);
    }

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return errorResponse('Banner not found', 404);
    }

    const { title, description, image, link } = body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (link !== undefined) updateData.link = link;

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No fields to update', 400);
    }

    await banner.update(updateData);

    // Fetch updated banner with all attributes
    const updatedBanner = await Banner.findByPk(id, {
      attributes: ['id', 'title', 'description', 'image', 'link', 'isActive', 'createdAt', 'updatedAt']
    });

    return successResponse(updatedBanner);
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

    const banner = await Banner.findByPk(id);
    if (!banner) {
      return errorResponse('Banner not found', 404);
    }

    await banner.destroy();
    return successResponse({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return errorResponse('Failed to delete banner', 500);
  }
};
