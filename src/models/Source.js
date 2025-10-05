const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Source = sequelize.define('Source', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    topicAreaId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'TopicAreas',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('pdf', 'rss', 'webpage', 'api'),
      defaultValue: 'pdf',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastCheckedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  }, {
    timestamps: true,
  });

  return Source;
};