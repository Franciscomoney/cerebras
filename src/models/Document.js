const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    sourceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Sources',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      comment: 'Unique identifier like A001, A002, etc.'
    },
    pdfUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pdfPath: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    markdownContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    aiAnalysis: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: true,
    indexes: [
      { fields: ['slug'] },
      { fields: ['publishedAt'] },
      { fields: ['processedAt'] },
    ],
  });

  return Document;
};