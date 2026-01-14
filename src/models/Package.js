module.exports = (sequelize, DataTypes) => {
  const Package = sequelize.define('Package', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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
      comment: 'Array of key features'
    },
    testCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'e.g., "30 minutes", "1 hour"'
    },
    reportDelivery: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'e.g., "24 hours", "48 hours"'
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'Packages',
    timestamps: true
  });

  Package.associate = (models) => {
    Package.hasMany(models.Test, { 
      foreignKey: 'packageId', 
      as: 'tests',
      onDelete: 'CASCADE'
    });
  };

  return Package;
};
