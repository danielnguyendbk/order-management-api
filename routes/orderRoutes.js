const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');

function successResponse(res, statusCode, message, data) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function errorResponse(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

function calculateItemsTotal(items = []) {
  return items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);
}

function isTotalAmountValid(items, totalAmount) {
  const expected = calculateItemsTotal(items);
  return Math.abs(expected - Number(totalAmount)) < 0.000001;
}

// 1. Lay toan bo don hang (GET /api/orders)
router.get('/', async (req, res) => {
  const { status, sort } = req.query;
  const query = {};
  const sortQuery = { createdAt: -1 };

  if (status) {
    query.status = status;
  }

  if (sort === 'asc' || sort === 'desc') {
    sortQuery.totalAmount = sort === 'asc' ? 1 : -1;
  }

  try {
    const orders = await Order.find(query).sort(sortQuery);
    return successResponse(res, 200, 'Lay danh sach don hang thanh cong', orders);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
});

// 2. Tim kiem theo ten khach hang (GET /api/orders/search?name=...)
router.get('/search', async (req, res) => {
  const { name } = req.query;

  if (!name) {
    return errorResponse(res, 400, 'Vui long cung cap query name de tim kiem');
  }

  try {
    const orders = await Order.find({
      customerName: { $regex: name, $options: 'i' }
    }).sort({ createdAt: -1 });

    return successResponse(res, 200, 'Tim kiem don hang thanh cong', orders);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
});
// 3. Lay don hang theo ID (GET /api/orders/:id)
router.get('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorResponse(res, 400, 'ID don hang khong hop le');
  }

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return errorResponse(res, 404, 'Khong tim thay don hang');
    }

    return successResponse(res, 200, 'Lay don hang thanh cong', order);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
});

// 4. Tao don hang moi (POST /api/orders)
router.post('/', async (req, res) => {
  const order = new Order({
    customerName: req.body.customerName,
    customerEmail: req.body.customerEmail,
    items: req.body.items,
    totalAmount: req.body.totalAmount,
    status: req.body.status
  });

  if (!isTotalAmountValid(order.items, order.totalAmount)) {
    return errorResponse(
      res,
      400,
      'totalAmount phai bang tong (quantity * unitPrice) cua tat ca items'
    );
  }

  try {
    const newOrder = await order.save();
    return successResponse(res, 201, 'Tao don hang thanh cong', newOrder);
  } catch (err) {
    return errorResponse(res, 400, err.message);
  }
});

// 5. Cap nhat trang thai don hang (PUT /api/orders/:id)
router.put('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorResponse(res, 400, 'ID don hang khong hop le');
  }

  try {
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) {
      return errorResponse(res, 404, 'Khong tim thay don hang');
    }

    const mergedItems = req.body.items !== undefined ? req.body.items : existingOrder.items;
    const mergedTotalAmount = req.body.totalAmount !== undefined
      ? req.body.totalAmount
      : existingOrder.totalAmount;

    if (!isTotalAmountValid(mergedItems, mergedTotalAmount)) {
      return errorResponse(
        res,
        400,
        'totalAmount phai bang tong (quantity * unitPrice) cua tat ca items'
      );
    }

    Object.assign(existingOrder, req.body);
    const updatedOrder = await existingOrder.save();
    return successResponse(res, 200, 'Cap nhat don hang thanh cong', updatedOrder);
  } catch (err) {
    return errorResponse(res, 400, err.message);
  }
});

// 6. Xoa don hang (DELETE /api/orders/:id)
router.delete('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return errorResponse(res, 400, 'ID don hang khong hop le');
  }

  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return errorResponse(res, 404, 'Khong tim thay don hang');
    }

    return successResponse(res, 200, 'Da xoa don hang thanh cong!', deleted);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
});

module.exports = router;