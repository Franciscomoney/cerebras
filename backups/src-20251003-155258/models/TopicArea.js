const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TopicArea = sequelize.define('TopicArea', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    keywords: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  }, {
    timestamps: true,
    indexes: [
      { fields: ['slug'] },
      { fields: ['isActive'] },
    ],
  });

  return TopicArea;
};