const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// Initialize Sequelize with Lambda-optimized settings
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 1,        // Single connection for Lambda
      min: 0,        // Start with no connections
      acquire: 5000, // 5 second timeout for acquiring connection
      idle: 500      // Immediately close idle connections
    },
    define: {
      timestamps: true,
      underscored: false
    },
    dialectOptions: {
      connectTimeout: 3000 // 3 second connection timeout
    }
  }
);

// DO NOT call authenticate() here - it blocks Lambda initialization
// Connection will be established lazily on first query

module.exports = { sequelize };
