'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_tenants_gender" AS ENUM ('male', 'female', 'other');
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_tenants_status" AS ENUM ('active', 'inactive', 'pending');
    `);

    await queryInterface.createTable('tenants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      national_id: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      date_of_birth: {
        type: Sequelize.DATEONLY
      },
      gender: {
        type: 'enum_tenants_gender'
      },
      occupation: {
        type: Sequelize.STRING(100)
      },
      employer: {
        type: Sequelize.STRING(200)
      },
      employer_phone: {
        type: Sequelize.STRING(20)
      },
      emergency_contact_name: {
        type: Sequelize.STRING(100)
      },
      emergency_contact_phone: {
        type: Sequelize.STRING(20)
      },
      current_address: {
        type: Sequelize.STRING(500)
      },
      move_in_date: {
        type: Sequelize.DATEONLY
      },
      move_out_date: {
        type: Sequelize.DATEONLY
      },
      status: {
        type: 'enum_tenants_status',
        defaultValue: 'pending'
      },
      unit_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'units',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      notes: {
        type: Sequelize.TEXT
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

    await queryInterface.addIndex('tenants', ['email']);
    await queryInterface.addIndex('tenants', ['phone']);
    await queryInterface.addIndex('tenants', ['status']);
    await queryInterface.addIndex('tenants', ['unit_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tenants');
    await queryInterface.sequelize.query('DROP TYPE "enum_tenants_gender";');
    await queryInterface.sequelize.query('DROP TYPE "enum_tenants_status";');
  }
};