const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'franciscomoney_intel',
  process.env.DB_USER || 'franciscomoney',
  process.env.DB_PASSWORD || 'password123',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const User = require('./User')(sequelize);
const Alert = require('./Alert')(sequelize);
const TopicArea = require('./TopicArea')(sequelize);
const Source = require('./Source')(sequelize);
const Document = require('./Document')(sequelize);
const Summary = require('./Summary')(sequelize);
const EmailLog = require('./EmailLog')(sequelize);
const Sponsor = require('./Sponsor')(sequelize);

// Define associations
User.hasMany(Alert, { foreignKey: 'userId', as: 'alerts' });
Alert.belongsTo(User, { foreignKey: 'userId', as: 'user' });

TopicArea.hasMany(Source, { foreignKey: 'topicAreaId', as: 'sources' });
Source.belongsTo(TopicArea, { foreignKey: 'topicAreaId', as: 'topicArea' });

Source.hasMany(Document, { foreignKey: 'sourceId', as: 'documents' });
Document.belongsTo(Source, { foreignKey: 'sourceId', as: 'source' });

Document.hasMany(Summary, { foreignKey: 'documentId', as: 'summaries' });
Summary.belongsTo(Document, { foreignKey: 'documentId', as: 'document' });

const models = {
  User,
  Alert,
  TopicArea,
  Source,
  Document,
  Summary,
  EmailLog,
  Sponsor,
  sequelize,
  Sequelize
};

module.exports = models;
