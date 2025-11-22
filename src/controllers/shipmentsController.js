const Shipment = require('../models/Shipment');
const { sendEmail, emailTemplates } = require('../utils/email');
const { notifyUser, notificationTypes } = require('../utils/notifications');

// Get all shipments
exports.getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .populate('order')
      .populate('vehicle')
      .populate('driver', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { shipments, count: shipments.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching shipments',
      error: error.message
    });
  }
};

// Update shipment with notification
exports.updateShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('order').populate('driver');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Send notification on status change
    if (req.body.status) {
      // Notify driver
      if (shipment.driver) {
        await notifyUser(
          shipment.driver._id,
          notificationTypes.SHIPMENT_UPDATED,
          'Shipment Status Updated',
          `Shipment ${shipment.trackingNumber} is now ${req.body.status}`,
          { shipmentId: shipment._id }
        );
      }

      // Send email if delivered
      if (req.body.status === 'delivered' && shipment.order) {
        const emailData = emailTemplates.shipmentUpdate(shipment, 'delivered');
        // Send to customer email (implement based on your order-customer relationship)
      }
    }

    res.status(200).json({
      success: true,
      message: 'Shipment updated successfully',
      data: shipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating shipment',
      error: error.message
    });
  }
};

// Track shipment (public endpoint)
exports.trackShipment = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    const shipment = await Shipment.findOne({ trackingNumber })
      .populate('order', 'orderNumber')
      .populate('vehicle', 'vehicleNumber type')
      .select('-__v');

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: shipment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error tracking shipment',
      error: error.message
    });
  }
};

module.exports = exports;
