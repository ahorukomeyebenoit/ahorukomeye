const Infrastructure = require('../models/Infrastructure');

exports.create = async (req, res) => {
  try {
    const infrastructure = await Infrastructure.create(req.body);
    res.status(201).json({
      success: true,
      data: infrastructure,
      message: 'Property created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const infrastructures = await Infrastructure.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json({
      success: true,
      data: infrastructures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.findOne = async (req, res) => {
  try {
    const infrastructure = await Infrastructure.findByPk(req.params.id);
    if (!infrastructure) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    res.json({
      success: true,
      data: infrastructure
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    const infrastructure = await Infrastructure.findByPk(req.params.id);
    if (!infrastructure) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    await infrastructure.update(req.body);
    res.json({
      success: true,
      data: infrastructure,
      message: 'Property updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.delete = async (req, res) => {
  try {
    const infrastructure = await Infrastructure.findByPk(req.params.id);
    if (!infrastructure) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    await infrastructure.destroy();
    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};