const Unit = require('../models/Unit');
const Infrastructure = require('../models/Infrastructure');
const { sequelize } = require('../config/database');

// Create unit
exports.create = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { infrastructure_id, ...unitData } = req.body;

    const infrastructure = await Infrastructure.findByPk(infrastructure_id, { transaction });
    if (!infrastructure) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Infrastructure not found'
      });
    }

    const unit = await Unit.create({
      infrastructure_id,
      ...unitData
    }, { transaction });

    await infrastructure.increment('total_units', { by: 1, transaction });

    await transaction.commit();
    res.status(201).json({
      success: true,
      data: unit,
      message: 'Unit created successfully'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all units
exports.findAll = async (req, res) => {
  try {
    const { infrastructure_id, status, type } = req.query;
    const where = {};

    if (infrastructure_id) where.infrastructure_id = infrastructure_id;
    if (status) where.status = status;
    if (type) where.type = type;

    const units = await Unit.findAll({
      where,
      include: [
        {
          model: Infrastructure,
          as: 'infrastructure',
          attributes: ['id', 'name', 'city']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: units
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single unit
exports.findOne = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id, {
      include: [
        {
          model: Infrastructure,
          as: 'infrastructure'
        }
      ]
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    res.json({
      success: true,
      data: unit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update unit
exports.update = async (req, res) => {
  try {
    const unit = await Unit.findByPk(req.params.id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    await unit.update(req.body);
    res.json({
      success: true,
      data: unit,
      message: 'Unit updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update unit status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const unit = await Unit.findByPk(req.params.id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    await unit.update({ status });
    res.json({
      success: true,
      data: unit,
      message: `Unit status updated to ${status}`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete unit
exports.delete = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const unit = await Unit.findByPk(req.params.id, { transaction });
    if (!unit) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    const infrastructure = await Infrastructure.findByPk(unit.infrastructure_id, { transaction });
    if (infrastructure) {
      await infrastructure.decrement('total_units', { by: 1, transaction });
    }

    await unit.destroy({ transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get available units
exports.getAvailable = async (req, res) => {
  try {
    const { infrastructure_id } = req.query;
    const where = { status: 'vacant' };
    if (infrastructure_id) where.infrastructure_id = infrastructure_id;

    const units = await Unit.findAll({
      where,
      include: [
        {
          model: Infrastructure,
          as: 'infrastructure',
          attributes: ['id', 'name', 'city']
        }
      ]
    });

    res.json({
      success: true,
      data: units,
      count: units.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};