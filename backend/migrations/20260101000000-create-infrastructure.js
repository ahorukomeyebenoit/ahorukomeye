'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_infrastructures_type" AS ENUM ('residential', 'commercial', 'mixed');
    `);

    await queryInterface.createTable('infrastructures', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      type: {
        type: 'enum_infrastructures_type',
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      address: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      district: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      province: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      country: {
        type: Sequelize.STRING(100),
        defaultValue: 'Rwanda'
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8)
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8)
      },
      total_units: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_floors: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      year_built: {
        type: Sequelize.INTEGER
      },
      has_elevator: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      has_parking: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      has_security: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      has_generator: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      water_meter_number: {
        type: Sequelize.STRING(50)
      },
      electricity_meter_number: {
        type: Sequelize.STRING(50)
      },
      owner_name: {
        type: Sequelize.STRING(200)
      },
      owner_phone: {
        type: Sequelize.STRING(20)
      },
      owner_email: {
        type: Sequelize.STRING(100)
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

    await queryInterface.addIndex('infrastructures', ['city', 'district', 'province']);
    await queryInterface.addIndex('infrastructures', ['type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('infrastructures');
    await queryInterface.sequelize.query('DROP TYPE "enum_infrastructures_type";');
  }
};