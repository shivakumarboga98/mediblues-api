const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize.js');



const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }

}, {
  tableName: 'locations',
  timestamps: true
});

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  heading: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  image: {
    type: DataTypes.TEXT('long'),
    allowNull: true
  },
  overview: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  achievements: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  legacy: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  treatments: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  facilities: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  }

}, {
  tableName: 'departments',
  timestamps: true
});

const Doctor = sequelize.define('Doctor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  qualifications: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  availability: {
    type: DataTypes.ENUM('available', 'busy', 'on_leave'),
    allowNull: true,
    defaultValue: 'available'
  },
  location_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Location,
      key: 'id'
    }
  }
}, {
  tableName: 'doctors',
  timestamps: true
});

const DoctorDepartment = sequelize.define('DoctorDepartment', {
  doctor_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Doctor,
      key: 'id'
    },
    primaryKey: true
  },
  department_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Department,
      key: 'id'
    },
    primaryKey: true
  }
}, {
  tableName: 'doctor_departments',
  timestamps: false
});

const DoctorSpecialization = sequelize.define('DoctorSpecialization', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Doctor,
      key: 'id'
    }
  },
  specialization: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'doctor_specializations',
  timestamps: false
});

const DepartmentLocation = sequelize.define('DepartmentLocation', {
  department_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Department,
      key: 'id'
    },
    primaryKey: true
  },
  location_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Location,
      key: 'id'
    },
    primaryKey: true
  }
}, {
  tableName: 'department_locations',
  timestamps: false
});

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  link: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isHero: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'banners',
  timestamps: true
});

const ContactInfo = sequelize.define('ContactInfo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contact_type: {
    type: DataTypes.ENUM('email', 'mobile'),
    allowNull: false
  },
  contact_value: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'contact',
  timestamps: true
});

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  mobileNumber: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  location_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Location,
      key: 'id'
    }
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Department,
      key: 'id'
    }
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Doctor,
      key: 'id'
    }
  },
  reasonForVisit: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  preferredDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  preferredTime: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'pending'
  },
  package_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'packages',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '1 = normal appointment, 2 = package booking'
  }
}, {
  tableName: 'appointments',
  timestamps: true
});

// Health Check Package and Test relationships
const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  discountPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  keyFeatures: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  tests: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'JSON array of test objects with {id, name} - each package has independent tests'
  },
  duration: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reportDelivery: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  image: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  ageRange: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: 'All ages'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'packages',
  timestamps: true
});

const Test = sequelize.define('Test', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  normalRange: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  unit: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'tests',
  timestamps: true
});

// Define all relationships AFTER all models are defined
Doctor.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Location.hasMany(Doctor, { foreignKey: 'location_id', as: 'doctors' });

Doctor.belongsToMany(Department, { through: DoctorDepartment, foreignKey: 'doctor_id', otherKey: 'department_id', as: 'departments' });
Department.belongsToMany(Doctor, { through: DoctorDepartment, foreignKey: 'department_id', otherKey: 'doctor_id', as: 'doctors' });

Doctor.hasMany(DoctorSpecialization, { foreignKey: 'doctor_id', as: 'specializations' });
DoctorSpecialization.belongsTo(Doctor, { foreignKey: 'doctor_id' });

Department.belongsToMany(Location, { through: DepartmentLocation, foreignKey: 'department_id', otherKey: 'location_id', as: 'locations' });
Location.belongsToMany(Department, { through: DepartmentLocation, foreignKey: 'location_id', otherKey: 'department_id', as: 'departments' });

// Appointment relationships
Appointment.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Location.hasMany(Appointment, { foreignKey: 'location_id', as: 'appointments' });

Appointment.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Department.hasMany(Appointment, { foreignKey: 'department_id', as: 'appointments' });

Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });
Doctor.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'appointments' });

// Package relationships (now Package is defined)
Appointment.belongsTo(Package, { foreignKey: 'package_id', as: 'package' });
Package.hasMany(Appointment, { foreignKey: 'package_id', as: 'appointments' });

module.exports = {
  Location,
  Department,
  Doctor,
  DoctorDepartment,
  DoctorSpecialization,
  DepartmentLocation,
  Banner,
  ContactInfo,
  Appointment,
  Package,
  Test,
  sequelize
};
