const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Initialize Sequelize
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'franciscomoney_intel',
  username: process.env.DB_USER || 'franciscomoney',
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? logger.info.bind(logger) : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

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

User.hasMany(Summary, { foreignKey: 'userId', as: 'summaries' });
Summary.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Alert.hasMany(Summary, { foreignKey: 'alertId', as: 'summaries' });
Summary.belongsTo(Alert, { foreignKey: 'alertId', as: 'alert' });

User.hasMany(EmailLog, { foreignKey: 'userId', as: 'emailLogs' });
EmailLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Sponsor can target multiple topic areas (many-to-many)
const SponsorTopicArea = sequelize.define('SponsorTopicArea', {});
Sponsor.belongsToMany(TopicArea, { through: SponsorTopicArea, as: 'topicAreas' });
TopicArea.belongsToMany(Sponsor, { through: SponsorTopicArea, as: 'sponsors' });

module.exports = {
  sequelize,
  User,
  Alert,
  TopicArea,
  Source,
  Document,
  Summary,
  EmailLog,
  Sponsor,
};