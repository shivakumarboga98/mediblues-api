import { query } from './database.js';

/**
 * Initialize database tables with proper relational design
 * Creates all necessary tables with foreign keys and junction tables
 */
export async function initializeTables() {
  try {
    // 1. Locations table
    await query(`
      CREATE TABLE IF NOT EXISTS locations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        address TEXT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image LONGTEXT,
        enabled BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_enabled (enabled)
      )
    `);

    // 2. Departments table
    await query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        heading VARCHAR(500),
        description TEXT,
        image LONGTEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      )
    `);

    // 3. Junction table: department_locations (many-to-many)
    await query(`
      CREATE TABLE IF NOT EXISTS department_locations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        department_id INT NOT NULL,
        location_id INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
        UNIQUE KEY unique_dept_location (department_id, location_id),
        INDEX idx_location_id (location_id)
      )
    `);

    // 4. Doctors table
    await query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        qualifications JSON,
        experience INT,
        location_id INT NOT NULL,
        image LONGTEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
        INDEX idx_location_id (location_id),
        INDEX idx_name (name)
      )
    `);

    // 5. Junction table: doctor_departments (many-to-many)
    await query(`
      CREATE TABLE IF NOT EXISTS doctor_departments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        doctor_id INT NOT NULL,
        department_id INT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
        UNIQUE KEY unique_doctor_dept (doctor_id, department_id),
        INDEX idx_department_id (department_id)
      )
    `);

    // 6. Specializations table (one-to-many with doctors)
    await query(`
      CREATE TABLE IF NOT EXISTS doctor_specializations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        doctor_id INT NOT NULL,
        specialization VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        INDEX idx_doctor_id (doctor_id)
      )
    `);

    // 7. Banners table
    await query(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        imageUrl LONGTEXT NOT NULL,
        dimensions VARCHAR(50),
        size VARCHAR(50),
        uploadDate DATE,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_isActive (isActive)
      )
    `);

    // 8. Helpline table
    await query(`
      CREATE TABLE IF NOT EXISTS helpline (
        id INT PRIMARY KEY AUTO_INCREMENT,
        phone VARCHAR(20) NOT NULL UNIQUE,
        description TEXT,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_isActive (isActive)
      )
    `);

    console.log('✅ All database tables initialized successfully with proper relational design');
    return { success: true };
  } catch (error) {
    console.error('❌ Error initializing tables:', error);
    throw error;
  }
}

/**
 * Seed initial helpline data if table is empty
 */
export async function seedInitialData() {
  try {
    // Check if helpline table has any data
    const helplineCount = await query('SELECT COUNT(*) as count FROM helpline');
    
    if (helplineCount[0].count === 0) {
      await query(`
        INSERT INTO helpline (phone, description, isActive)
        VALUES (?, ?, ?)
      `, ['+91-9876543210', 'Available 24/7 for customer support', true]);
      console.log('✅ Initial helpline data seeded');
    }

    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}


/**
 * Drop all tables (for development/testing only)
 */
export async function dropAllTables() {
  try {
    await query('DROP TABLE IF EXISTS helpline');
    await query('DROP TABLE IF EXISTS banners');
    await query('DROP TABLE IF EXISTS doctor_specializations');
    await query('DROP TABLE IF EXISTS doctor_departments');
    await query('DROP TABLE IF EXISTS doctors');
    await query('DROP TABLE IF EXISTS department_locations');
    await query('DROP TABLE IF EXISTS departments');
    await query('DROP TABLE IF EXISTS locations');
    console.log('✅ All tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  }
}
