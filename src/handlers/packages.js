const { Package } = require('../models/index.js');
const { successResponse, errorResponse } = require('../utils/response.js');
const { protectedEndpoint } = require('./adminAuth.js');

/**
 * GET /packages - Get all packages with tests (Public read)
 */
const getAllPackagesHandler = async (event) => {
  try {
    // Get pagination parameters from query string
    const queryParams = event.queryStringParameters || {};
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const offset = (page - 1) * limit;

    console.log('Pagination params - Page:', page, 'Limit:', limit, 'Offset:', offset);

    // Get total count
    const totalCount = await Package.count({
      where: { isActive: true }
    });

    // Get paginated package IDs first
    const packageIds = await Package.findAll({
      where: { isActive: true },
      attributes: ['id'],
      order: [['id', 'DESC']],
      limit: limit,
      offset: offset,
      raw: true
    });

    // Extract IDs
    const ids = packageIds.map(p => p.id);

    // Get full packages (tests are stored as JSON in the model)
    const packages = await Package.findAll({
      where: { 
        id: ids,
        isActive: true 
      },
      order: [['id', 'DESC']]
    });

    console.log('Packages returned:', packages.length, 'Total count:', totalCount);

    return successResponse({
      data: packages,
      total: totalCount,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalCount / limit)
    }, 200);
  } catch (error) {
    console.error('Error getting packages:', error);
    return errorResponse('Failed to retrieve packages', 500);
  }
};

/**
 * GET /packages/:id - Get package by ID with tests (Public read)
 */
const getPackageByIdHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const packageId = body.id;

    if (!packageId) {
      return errorResponse('Package ID is required', 400);
    }

    const pkg = await Package.findByPk(packageId);

    if (!pkg) {
      return errorResponse('Package not found', 404);
    }

    return successResponse(pkg, 200);
  } catch (error) {
    console.error('Error getting package:', error);
    return errorResponse('Failed to retrieve package', 500);
  }
};

/**
 * POST /packages - Create new package (Admin only - JWT protected)
 */
const createPackageHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} creating package`);
    
    const body = JSON.parse(event.body || '{}');
    const { name, description, price, discountPrice, keyFeatures, duration, reportDelivery, image, ageRange, tests = [] } = body;

    if (!name || !price) {
      return errorResponse('Name and price are required', 400);
    }

    const newPackage = await Package.create({
      name,
      description,
      price,
      discountPrice,
      keyFeatures,
      duration,
      reportDelivery,
      image,
      ageRange,
      tests: Array.isArray(tests) ? tests : []
    });

    return successResponse(newPackage, 201);
  } catch (error) {
    console.error('Error creating package:', error);
    return errorResponse('Failed to create package', 500);
  }
};

/**
 * PUT /packages/:id - Update package (Admin only - JWT protected)
 */
const updatePackageHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} updating package`);
    
    const body = JSON.parse(event.body || '{}');
    const { id, name, description, price, discountPrice, keyFeatures, duration, reportDelivery, image, isActive, ageRange, tests = [] } = body;

    if (!id) {
      return errorResponse('Package ID is required', 400);
    }

    const pkg = await Package.findByPk(id);
    if (!pkg) {
      return errorResponse('Package not found', 404);
    }

    await pkg.update({
      name: name || pkg.name,
      description: description !== undefined ? description : pkg.description,
      price: price || pkg.price,
      discountPrice: discountPrice !== undefined ? discountPrice : pkg.discountPrice,
      keyFeatures: keyFeatures || pkg.keyFeatures,
      duration: duration !== undefined ? duration : pkg.duration,
      reportDelivery: reportDelivery !== undefined ? reportDelivery : pkg.reportDelivery,
      image: image !== undefined ? image : pkg.image,
      isActive: isActive !== undefined ? isActive : pkg.isActive,
      ageRange: ageRange !== undefined ? ageRange : pkg.ageRange,
      tests: Array.isArray(tests) ? tests : pkg.tests || []
    });

    return successResponse(pkg, 200);
  } catch (error) {
    console.error('Error updating package:', error);
    return errorResponse('Failed to update package', 500);
  }
};

/**
 * DELETE /packages/:id - Delete package (Admin only - JWT protected)
 */
const deletePackageHandler = async (event) => {
  try {
    console.log(`✓ Admin ${event.admin?.email || 'unknown'} deleting package`);
    
    const body = JSON.parse(event.body || '{}');
    const packageId = body.id;

    if (!packageId) {
      return errorResponse('Package ID is required', 400);
    }

    const pkg = await Package.findByPk(packageId);
    if (!pkg) {
      return errorResponse('Package not found', 404);
    }

    await pkg.destroy();
    return successResponse({ message: 'Package deleted successfully' }, 200);
  } catch (error) {
    console.error('Error deleting package:', error);
    return errorResponse('Failed to delete package', 500);
  }
};

// Export handlers
module.exports.getAllPackages = getAllPackagesHandler;
module.exports.getPackageById = getPackageByIdHandler;
module.exports.createPackage = protectedEndpoint(createPackageHandler);
module.exports.updatePackage = protectedEndpoint(updatePackageHandler);
module.exports.deletePackage = protectedEndpoint(deletePackageHandler);
