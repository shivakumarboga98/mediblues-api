const fs = require('fs');
const path = require('path');

// Determine which .env file to load based on stage or existing files
module.exports.envPath = (() => {
  const stage = process.env.STAGE || 'local';
  
  // Define potential env file paths
  const envPaths = {
    local: ['.env.local', '.env'],
    dev: ['.env.local', '.env.dev', '.env'],
    prod: ['.env.production', '.env.prod'],
    production: ['.env.production', '.env.prod']
  };
  
  // Get the env files to check for the current stage
  const filesToCheck = envPaths[stage] || ['.env.local', '.env'];
  
  // Find the first existing file
  for (const envFile of filesToCheck) {
    const envPath = path.join(__dirname, envFile);
    if (fs.existsSync(envPath)) {
      console.log(`✓ Using environment file: ${envFile}`);
      return envFile;
    }
  }
  
  // Fallback to the first option if none exist
  const fallback = filesToCheck[0];
  console.log(`⚠ Environment file not found, using fallback: ${fallback}`);
  return fallback;
})();
