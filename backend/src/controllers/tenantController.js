const Tenant = require('../models/Tenant');
const Unit = require('../models/Unit');
const { sequelize } = require('../config/database');

// Create tenant
exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { unit_id, ...tenantData } = req.body;

    // Check if unit exists and is vacant
    if (unit_id) {
      const unit = await Unit.findByPk(unit_id, { transaction });
      if (!unit) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }
      if (unit.status !== 'vacant') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Unit is not vacant'
        });
      }
    }

    const tenant = await Tenant.create({
      unit_id,
      ...tenantData
    }, { transaction });

    // Update unit status to occupied
    if (unit_id) {
      await Unit.update(
        { status: 'occupied' },
        { where: { id: unit_id }, transaction }
      );
    }

    await transaction.commit();
    res.status(201).json({
      success: true,
      data: tenant,
      message: 'Tenant created successfully'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all tenants
exports.findAll = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status) where.status = status;

    const tenants = await Tenant.findAll({
      where,
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unit_number', 'floor', 'monthly_rent']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: tenants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single tenant
exports.findOne = async (req, res) => {
  try {
    const tenant = await Tenant.findByPk(req.params.id, {
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unit_number', 'floor', 'monthly_rent']
        }
      ]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update tenant
exports.update = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const tenant = await Tenant.findByPk(req.params.id, { transaction });
    if (!tenant) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    const { unit_id, ...updateData } = req.body;

    // If unit is being changed
    if (unit_id && unit_id !== tenant.unit_id) {
      const unit = await Unit.findByPk(unit_id, { transaction });
      if (!unit) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Unit not found'
        });
      }
      if (unit.status !== 'vacant') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Unit is not vacant'
        });
      }

      // Free old unit
      if (tenant.unit_id) {
        await Unit.update(
          { status: 'vacant' },
          { where: { id: tenant.unit_id }, transaction }
        );
      }

      // Occupy new unit
      await Unit.update(
        { status: 'occupied' },
        { where: { id: unit_id }, transaction }
      );
    }

    await tenant.update({
      unit_id: unit_id || tenant.unit_id,
      ...updateData
    }, { transaction });

    await transaction.commit();
    res.json({
      success: true,
      data: tenant,
      message: 'Tenant updated successfully'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete tenant (soft delete)
exports.delete = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const tenant = await Tenant.findByPk(req.params.id, { transaction });
    if (!tenant) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    // Free the unit
    if (tenant.unit_id) {
      await Unit.update(
        { status: 'vacant' },
        { where: { id: tenant.unit_id }, transaction }
      );
    }

    await tenant.destroy({ transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: 'Tenant deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get tenants by unit
exports.getByUnit = async (req, res) => {
  try {
    const { unit_id } = req.params;
    const tenants = await Tenant.findAll({
      where: { unit_id },
      include: [
        {
          model: Unit,
          as: 'unit',
          attributes: ['id', 'unit_number', 'monthly_rent']
        }
      ]
    });

    res.json({
      success: true,
      data: tenants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};