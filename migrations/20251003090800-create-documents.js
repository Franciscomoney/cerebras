'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create Documents table (global repository)
    await queryInterface.createTable('Documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      url: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true,
      },
      contentHash: {
        type: Sequelize.STRING(64),
        allowNull: true,
        comment: 'SHA256 hash of PDF content for duplicate detection'
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      organization: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      
      // Processed content (stored once, reused many times)
      markdownContent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      htmlPath: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      
      // AI-generated baseline analysis (topic-agnostic)
      baselineSummary: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      extractedTopics: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      extractedEntities: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      
      // Reuse tracking
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      timesReferenced: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      
      // Status
      processingStatus: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'duplicate'),
        defaultValue: 'pending',
      },
      duplicateOf: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Documents',
          key: 'id',
        },
      },
      
      // Metadata
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {},
      },
      
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex('Documents', ['url']);
    await queryInterface.addIndex('Documents', ['contentHash']);
    await queryInterface.addIndex('Documents', ['processingStatus']);
    await queryInterface.addIndex('Documents', ['publishedAt']);
    await queryInterface.addIndex('Documents', ['organization']);
    
    // Add documentId to Sources table
    await queryInterface.addColumn('Sources', 'documentId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Documents',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Add discovery metadata to Sources
    await queryInterface.addColumn('Sources', 'discoveryMethod', {
      type: Sequelize.ENUM('manual', 'automated'),
      defaultValue: 'manual',
    });

    await queryInterface.addColumn('Sources', 'relevanceScore', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'AI-generated relevance score for this topic area (0-1)',
    });

    await queryInterface.addColumn('Sources', 'userNotes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('Sources', 'customTags', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove added columns from Sources
    await queryInterface.removeColumn('Sources', 'customTags');
    await queryInterface.removeColumn('Sources', 'userNotes');
    await queryInterface.removeColumn('Sources', 'relevanceScore');
    await queryInterface.removeColumn('Sources', 'discoveryMethod');
    await queryInterface.removeColumn('Sources', 'documentId');
    
    // Drop Documents table
    await queryInterface.dropTable('Documents');
  }
};
