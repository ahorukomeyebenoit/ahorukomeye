'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_expenses_category" AS ENUM (
        'repair',
        'maintenance',
        'utilities',
        'cleaning',
        'security',
        'taxes',
        'salaries',
        'insurance',
        'transport',
        'communication',
        'supplies',
        'other'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_expenses_status" AS ENUM (
        'pending',
        'approved',
        'rejected'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_expenses_paid_by" AS ENUM (
        'owner',
        'manager',
        'tenant'
      );
    `);

    await queryInterface.createTable('expenses', {
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
      category: {
        type: 'enum_expenses_category',
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      expense_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_DATE')
      },
      paid_by: {
        type: 'enum_expenses_paid_by',
        defaultValue: 'owner'
      },
      receipt_file: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      receipt_type: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      status: {
        type: 'enum_expenses_status',
        defaultValue: 'pending'
      },
      approved_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      rejection_reason: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    await queryInterface.addIndex('expenses', ['infrastructure_id']);
    await queryInterface.addIndex('expenses', ['unit_id']);
    await queryInterface.addIndex('expenses', ['category']);
    await queryInterface.addIndex('expenses', ['status']);
    await queryInterface.addIndex('expenses', ['expense_date']);
    await queryInterface.addIndex('expenses', ['approved_by']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('expenses');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_expenses_category";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_expenses_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_expenses_paid_by";');
  }
};