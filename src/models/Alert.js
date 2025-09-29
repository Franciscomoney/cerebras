const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    query: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
      defaultValue: 'weekly',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        itemsPerEmail: 5,
        includeSponsored: true,
      },
    },
  }, {
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['isActive'] },
      { fields: ['frequency'] },
    ],
  });

  return Alert;
};