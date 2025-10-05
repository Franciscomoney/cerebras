const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Summary = sequelize.define('Summary', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    documentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Documents',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    alertId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Alerts',
        key: 'id',
      },
    },
    summaryText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    keyRecommendations: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
    },
    impactScore: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 10,
      },
    },
    biasFlags: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: true,
  });

  return Summary;
};