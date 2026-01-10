import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Sequelize with Lambda-optimized settings
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 2,        // Reduced for Lambda
      min: 0,        // Start with no connections
      acquire: 10000, // Reduced from 30s to 10s
      idle: 1000     // Reduced from 10s to 1s
    },
    define: {
      timestamps: true,
      underscored: false
    },
    dialectOptions: {
      connectTimeout: 5000 // 5 second connection timeout
    }
  }
);

// DO NOT call authenticate() here - it blocks Lambda initialization
// Connection will be established lazily on first query
