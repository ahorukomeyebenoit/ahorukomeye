'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_ledgers_status" AS ENUM ('unpaid', 'partially_paid', 'paid');
    `);

    await queryInterface.createTable('ledgers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      tenant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      unit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'units',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      period_start: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      period_end: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      amount_due: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      amount_paid: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0
      },
      balance: {
        type: Sequelize.DECIMAL(15, 2),
        defaultValue: 0
      },
      status: {
        type: 'enum_ledgers_status',
        defaultValue: 'unpaid'
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      paid_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
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

    await queryInterface.addIndex('ledgers', ['tenant_id']);
    await queryInterface.addIndex('ledgers', ['unit_id']);
    await queryInterface.addIndex('ledgers', ['status']);
    await queryInterface.addIndex('ledgers', ['period_start', 'period_end']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ledgers');
    await queryInterface.sequelize.query('DROP TYPE "enum_ledgers_status";');
  }
}