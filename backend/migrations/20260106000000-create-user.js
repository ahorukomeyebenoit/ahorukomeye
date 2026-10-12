'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_role" AS ENUM ('admin', 'manager', 'tenant');
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_status" AS ENUM ('pending', 'active', 'inactive', 'suspended');
    `);

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      role: {
        type: 'enum_users_role',
        allowNull: false
      },
      status: {
        type: 'enum_users_status',
        defaultValue: 'pending'
      },
      // Multi-tenancy scoping
      admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      manager_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      // Verification
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      phone_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      invitation_token: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      invited_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      activated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // Session info
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // Subscription
      plan: {
        type: Sequelize.ENUM('free', 'premium', 'business'),
        defaultValue: 'free'
      },
      tenant_limit: {
        type: Sequelize.INTEGER,
        defaultValue: 5
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
      },
      deleted_at: {
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['phone']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['status']);
    await queryInterface.addIndex('users', ['admin_id']);
    await queryInterface.addIndex('users', ['manager_id']);
    await queryInterface.addIndex('users', ['tenant_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_plan";');
  }
};