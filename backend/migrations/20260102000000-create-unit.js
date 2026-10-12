'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_units_type" AS ENUM ('apartment', 'office', 'shop', 'warehouse', 'studio');
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_units_status" AS ENUM ('vacant', 'occupied', 'maintenance', 'reserved');
    `);

    await queryInterface.createTable('units', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      infrastructure_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'infrastructures',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      unit_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      floor: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      type: {
        type: 'enum_units_type',
        allowNull: false
      },
      status: {
        type: 'enum_units_status',
        defaultValue: 'vacant'
      },
      size_sqm: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      bedrooms: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      bathrooms: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      monthly_rent: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      security_deposit: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0
      },
      is_furnished: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      has_water_meter: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      has_electricity_meter: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      description: {
        type: Sequelize.TEXT
      },
      features: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      images: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      current_tenant_id: {
        type: Sequelize.UUID,
        allowNull: true
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

    await queryInterface.addConstraint('units', {
      fields: ['infrastructure_id', 'unit_number'],
      type: 'unique',
      name: 'unique_unit_number_per_property'
    });

    await queryInterface.addIndex('units', ['infrastructure_id']);
    await queryInterface.addIndex('units', ['status']);
    await queryInterface.addIndex('units', ['type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('units');
    await queryInterface.sequelize.query('DROP TYPE "enum_units_type";');
    await queryInterface.sequelize.query('DROP TYPE "enum_units_status";');
  }
};