import { DataTypes } from 'sequelize';
import { sequelize } from '../config/sequelize.js';



export const Location = sequelize.define('Location', {
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

export const Department = sequelize.define('Department', {
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
    type: DataTypes.TEXT('long'), // matches longtext
    allowNull: true
  }

}, {
  tableName: 'departments',
  timestamps: true
});

export const Doctor = sequelize.define('Doctor', {
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

export const DoctorDepartment = sequelize.define('DoctorDepartment', {
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

export const DoctorSpecialization = sequelize.define('DoctorSpecialization', {
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

export const DepartmentLocation = sequelize.define('DepartmentLocation', {
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

export const Banner = sequelize.define('Banner', {
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
  }
}, {
  tableName: 'banners',
  timestamps: true
});

export const ContactInfo = sequelize.define('ContactInfo', {
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

// Define relationships
Doctor.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });
Location.hasMany(Doctor, { foreignKey: 'location_id', as: 'doctors' });

Doctor.belongsToMany(Department, { through: DoctorDepartment, foreignKey: 'doctor_id', otherKey: 'department_id', as: 'departments' });
Department.belongsToMany(Doctor, { through: DoctorDepartment, foreignKey: 'department_id', otherKey: 'doctor_id', as: 'doctors' });

Doctor.hasMany(DoctorSpecialization, { foreignKey: 'doctor_id', as: 'specializations' });
DoctorSpecialization.belongsTo(Doctor, { foreignKey: 'doctor_id' });

Department.belongsToMany(Location, { through: DepartmentLocation, foreignKey: 'department_id', otherKey: 'location_id', as: 'locations' });
Location.belongsToMany(Department, { through: DepartmentLocation, foreignKey: 'location_id', otherKey: 'department_id', as: 'departments' });

export default sequelize;
