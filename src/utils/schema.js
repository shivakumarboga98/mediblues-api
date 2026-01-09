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
    await query(`DROP TABLE IF EXISTS banners`);
    await query(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image LONGTEXT,
        link VARCHAR(500),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 8. Contact Info table
    await query(`DROP TABLE IF EXISTS contact`);
    await query(`
      CREATE TABLE IF NOT EXISTS contact (
        id INT PRIMARY KEY AUTO_INCREMENT,
        contact_type ENUM('email', 'mobile') NOT NULL,
        contact_value VARCHAR(255) NOT NULL,
        description TEXT,
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_contact (contact_type, contact_value),
        INDEX idx_isActive (isActive),
        INDEX idx_type (contact_type)
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
 * Seed initial contact data if table is empty
 */
export async function seedInitialData() {
  try {
    // Check if contact table has any data
    const contactCount = await query('SELECT COUNT(*) as count FROM contact');
    
    if (contactCount[0].count === 0) {
      await query(`
        INSERT INTO contact (contact_type, contact_value, description, isActive)
        VALUES (?, ?, ?, ?), (?, ?, ?, ?)
      `, ['mobile', '+91-9876543210', 'MediBlues Helpline', true, 'email', 'info@mediblues.com', 'Customer Support', true]);
      console.log('✅ Initial contact data seeded');
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
    await query('DROP TABLE IF EXISTS contact');
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
