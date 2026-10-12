'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_otp_codes_purpose" AS ENUM ('login', 'verify_phone', 'verify_email', 'password_reset', 'accept_invite');
    `);

    await queryInterface.createTable('otp_codes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      code: {
        type: Sequelize.STRING(6),
        allowNull: false
      },
      purpose: {
        type: 'enum_otp_codes_purpose',
        allowNull: false
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('otp_codes', ['user_id']);
    await queryInterface.addIndex('otp_codes', ['phone']);
    await queryInterface.addIndex('otp_codes', ['email']);
    await queryInterface.addIndex('otp_codes', ['code']);
    await queryInterface.addIndex('otp_codes', ['purpose']);
    await queryInterface.addIndex('otp_codes', ['expires_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('otp_codes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_otp_codes_purpose";');
  }
};