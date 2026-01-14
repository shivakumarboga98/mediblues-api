import { query, testConnection, closePool } from '../src/utils/database.js';

async function checkDoctors() {
  try {
    await testConnection();
    console.log('✅ Connected to database\n');
    
    // Check if doctor_specializations table exists
    const tables = await query("SHOW TABLES LIKE 'doctor_specializations'");
    console.log('Doctor specializations table exists:', tables.length > 0);
    
    // Get all doctors
    const doctors = await query('SELECT * FROM doctors');
    console.log('\n📊 Doctors in database:', doctors.length);
    
    for (const doc of doctors) {
      console.log(`\n👨‍⚕️ ${doc.name} (ID: ${doc.id})`);
      console.log(`   Location ID: ${doc.location_id}`);
      console.log(`   Experience: ${doc.experience} years`);
      
      // Get departments
      const depts = await query(`
        SELECT d.name FROM departments d
        INNER JOIN doctor_departments dd ON d.id = dd.department_id
        WHERE dd.doctor_id = ?
      `, [doc.id]);
      console.log(`   Departments: ${depts.map(d => d.name).join(', ') || 'None'}`);
      
      // Get specializations
      try {
        const specs = await query(`
          SELECT specialization FROM doctor_specializations WHERE doctor_id = ?
        `, [doc.id]);
        console.log(`   Specializations: ${specs.map(s => s.specialization).join(', ') || 'None'}`);
      } catch(err) {
        console.log(`   Specializations: ERROR - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await closePool();
  }
}

checkDoctors();
