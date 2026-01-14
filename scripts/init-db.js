#!/usr/bin/env node

/**
 * Database Initialization Script
 * Run this once to create all tables and seed initial data
 * 
 * Usage: node scripts/init-db.js
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config({ path: '.env.local' });

// Create connection without database to create the database first
async function createDatabase() {
  try {
    console.log('📡 Creating database if it does not exist...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ Database '${process.env.DB_NAME}' ensured\n`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    throw error;
  }
}

// Now import the utilities that require the database
import { testConnection, closePool, query } from '../src/utils/database.js';
import { initializeTables, seedInitialData } from '../src/utils/schema.js';

async function seedSampleData() {
  try {
    console.log('🌱 Seeding sample data for relational schema...');

    // Create sample locations
    await query(`
      INSERT INTO locations (name, address, phone, email, enabled) VALUES
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?),
      (?, ?, ?, ?, ?)
    `, [
      'Hyderabad Center', 'Hitech City, Hyderabad', '+91-40-1234567', 'hyderabad@mediblues.com', true,
      'Bangalore Center', 'Indiranagar, Bangalore', '+91-80-2234567', 'bangalore@mediblues.com', true,
      'Delhi Center', 'Gurugram, Delhi', '+91-11-3234567', 'delhi@mediblues.com', true
    ]);
    console.log('✅ Created 3 locations');

    // Fetch created location IDs
    const locations = await query('SELECT id FROM locations ORDER BY id ASC');
    const [loc1, loc2, loc3] = locations.map(l => l.id);

    // Create sample departments
    await query(`
      INSERT INTO departments (name, heading, description) VALUES
      (?, ?, ?),
      (?, ?, ?),
      (?, ?, ?)
    `, [
      'Cardiology', 'Heart & Vascular Care', 'Expert cardiologists providing comprehensive heart care',
      'Neurology', 'Brain & Nervous System', 'Advanced neurological treatments and diagnostics',
      'Orthopedics', 'Bone & Joint Care', 'Orthopedic surgery and rehabilitation services'
    ]);
    console.log('✅ Created 3 departments');

    // Fetch created department IDs
    const departments = await query('SELECT id FROM departments ORDER BY id ASC');
    const [dept1, dept2, dept3] = departments.map(d => d.id);

    // Link departments to locations (department_locations junction table)
    // Cardiology in all 3 locations
    // Neurology in Hyderabad and Bangalore
    // Orthopedics in Bangalore and Delhi
    await query(`
      INSERT INTO department_locations (department_id, location_id) VALUES
      (?, ?), (?, ?), (?, ?),
      (?, ?), (?, ?),
      (?, ?), (?, ?)
    `, [
      dept1, loc1, dept1, loc2, dept1, loc3,  // Cardiology in all locations
      dept2, loc1, dept2, loc2,               // Neurology in Hyderabad and Bangalore
      dept3, loc2, dept3, loc3                // Orthopedics in Bangalore and Delhi
    ]);
    console.log('✅ Linked departments to locations');

    // Create sample doctors with location_id
    await query(`
      INSERT INTO doctors (name, qualifications, experience, location_id) VALUES
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?)
    `, [
      'Dr. Rajesh Kumar', JSON.stringify(['MBBS', 'MD Cardiology']), 12, loc1,
      'Dr. Priya Sharma', JSON.stringify(['MBBS', 'DM Neurology']), 8, loc1,
      'Dr. Amit Patel', JSON.stringify(['MBBS', 'MS Orthopedics']), 15, loc2,
      'Dr. Sarah Johnson', JSON.stringify(['MBBS', 'MD Cardiology', 'MRCP']), 10, loc2,
      'Dr. Vikram Singh', JSON.stringify(['MBBS', 'MS Orthopedics', 'Fellowship']), 18, loc3
    ]);
    console.log('✅ Created 5 sample doctors');

    // Fetch created doctor IDs
    const doctors = await query('SELECT id FROM doctors ORDER BY id ASC');
    const [doc1, doc2, doc3, doc4, doc5] = doctors.map(d => d.id);

    // Link doctors to departments (doctor_departments junction table)
    // Dr. Rajesh Kumar -> Cardiology
    // Dr. Priya Sharma -> Neurology
    // Dr. Amit Patel -> Orthopedics
    // Dr. Sarah Johnson -> Cardiology
    // Dr. Vikram Singh -> Orthopedics
    await query(`
      INSERT INTO doctor_departments (doctor_id, department_id) VALUES
      (?, ?), (?, ?), (?, ?), (?, ?), (?, ?)
    `, [
      doc1, dept1,  // Dr. Rajesh -> Cardiology
      doc2, dept2,  // Dr. Priya -> Neurology
      doc3, dept3,  // Dr. Amit -> Orthopedics
      doc4, dept1,  // Dr. Sarah -> Cardiology
      doc5, dept3   // Dr. Vikram -> Orthopedics
    ]);
    console.log('✅ Linked doctors to departments');

    // Add specializations for doctors
    await query(`
      INSERT INTO doctor_specializations (doctor_id, specialization) VALUES
      (?, ?), (?, ?), 
      (?, ?), (?, ?),
      (?, ?), (?, ?),
      (?, ?), (?, ?),
      (?, ?), (?, ?)
    `, [
      1, 'Interventional Cardiology', 1, 'Coronary Angiography',
      2, 'Stroke Neurology', 2, 'Epilepsy Management',
      3, 'Joint Replacement', 3, 'Sports Medicine',
      4, 'Heart Failure Management', 4, 'Preventive Cardiology',
      5, 'Arthroscopic Surgery', 5, 'Trauma Surgery'
    ]);
    console.log('✅ Added specializations for doctors');

    console.log('\n📊 Sample Data Summary:');
    console.log('  • 3 Locations (Hyderabad, Bangalore, Delhi)');
    console.log('  • 3 Departments (Cardiology, Neurology, Orthopedics)');
    console.log('  • 5 Doctors with location assignments');
    console.log('  • Department-Location relationships (7 links)');
    console.log('  • Doctor-Department relationships (5 links)');
    console.log('  • Doctor specializations (10 specializations)');
  } catch (error) {
    console.error('❌ Error seeding sample data:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database initialization...\n');

  try {
    // Create database first
    await createDatabase();

    // Test connection
    console.log('📡 Testing database connection...');
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error(connectionTest.error);
    }
    console.log('✅ Database connection successful\n');

    // Initialize tables
    console.log('📋 Creating database tables (with relational schema)...');
    await initializeTables();
    console.log('✅ Database tables created\n');

    // Seed initial data
    console.log('🌱 Seeding initial helpline data...');
    await seedInitialData();
    console.log('✅ Helpline data seeded\n');

    // Seed sample data
    await seedSampleData();

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Run: npm run dev (to start local development server)');
    console.log('2. Or run: npm run deploy (to deploy to AWS)');
    console.log('\n💡 Test endpoints with sample data:');
    console.log('  GET http://localhost:3000/locations');
    console.log('  GET http://localhost:3000/departments');
    console.log('  GET http://localhost:3000/doctors');
    
    await closePool();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:');
    console.error(error.message);
    await closePool();
    process.exit(1);
  }
}

main();
