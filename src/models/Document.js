const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sourceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Sources',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pdfUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pdfPath: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    markdownContent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    aiAnalysis: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'Documents',
    timestamps: true
  });

  return Document;
};
