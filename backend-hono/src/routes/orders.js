import { Hono } from 'hono';

const orders = new Hono();

// Helper to parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return {}; }
};

// ✅ GET /user - User ke saare orders
orders.get('/user', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, message: 'User not authenticated' }, 401);
    }

    console.log('📦 Fetching orders for user ID:', user.id);

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE userId = ? ORDER BY orderDate DESC`
    ).bind(user.id).all();

    console.log(`✅ Found ${results.length} orders`);
    
    // Parse items JSON for each order
    const parsedResults = results.map(order => ({
      ...order,
      items: safeParse(order.items),
      buyerAddress: safeParse(order.buyerAddress)
    }));
    
    return c.json(parsedResults);
  } catch (error) {
    console.error('❌ CRITICAL ERROR in /api/orders/user:', error);
    return c.json({ success: false, message: 'Failed to fetch orders' }, 500);
  }
});

// ✅ GET /all - Admin ke liye saare orders
orders.get('/all', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM orders ORDER BY orderDate DESC`
    ).all();

    return c.json(results);
  } catch (error) {
    console.error('❌ Error fetching all orders:', error);
    return c.json({ success: false, message: 'Failed to fetch orders' }, 500);
  }
});

// ✅ GET /returns/all - Admin ke liye return requests
orders.get('/returns/all', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE returnRequested = 1 ORDER BY orderDate DESC`
    ).all();

    return c.json(results);
  } catch (error) {
    console.error('❌ Error fetching returns:', error);
    return c.json({ success: false, message: 'Failed to fetch returns' }, 500);
  }
});

// ✅ GET /:id - Single order
orders.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, message: 'User not authenticated' }, 401);
    }

    const orderId = parseInt(c.req.param('id'));
    
    // Admin can see any order, user can see only their own
    let query = `SELECT * FROM orders WHERE id = ?`;
    let params = [orderId];
    
    if (user.role !== 'admin') {
      query += ` AND userId = ?`;
      params.push(user.id);
    }

    const order = await c.env.DB.prepare(query).bind(...params).first();

    if (!order) {
      return c.json({ success: false, message: 'Order not found' }, 404);
    }

    // Parse JSON fields
    order.items = safeParse(order.items);
    order.buyerAddress = safeParse(order.buyerAddress);

    return c.json(order);
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    return c.json({ success: false, message: 'Failed to fetch order' }, 500);
  }
});

// ✅ POST / - Create new order (IMPROVED)
orders.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, message: 'User not authenticated' }, 401);
    }

    const { 
      items, 
      total, 
      shippingAddress, 
      buyerAddress,
      paymentMethod = 'cod',
      notes 
    } = await c.req.json();

    if (!items || items.length === 0) {
      return c.json({ success: false, message: 'No items in order' }, 400);
    }

    // Calculate total if not provided
    const calculatedTotal = total || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Generate order number
    const orderNumber = `MPS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Get first item for main product fields
    const firstItem = items[0];
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    // Prepare items JSON with full details
    const itemsJson = JSON.stringify(items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || null,
      variationName: item.variationName || null,
      variationSecondary: item.variationSecondary || null,
      vendorId: item.vendorId || null,
      vendorName: item.vendorName || item.brand || 'N/A'
    })));

    // Use buyerAddress if provided, else shippingAddress
    const addressToUse = buyerAddress || shippingAddress || {};
    
    // Create order in D1
    const result = await c.env.DB.prepare(
      `INSERT INTO orders (
        orderNumber, buyerId, userId, buyerName, buyerEmail, buyerPhone, 
        buyerAddress, vendorId, vendorName, productId, productName, 
        quantity, price, total, status, paymentMethod, paymentStatus, 
        orderDate, items, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`
    ).bind(
      orderNumber,
      user.id, // buyerId
      user.id, // userId
      user.name || addressToUse.fullName || 'Customer',
      user.email || addressToUse.email || '',
      user.phone || addressToUse.phone || '',
      JSON.stringify(addressToUse),
      firstItem?.vendorId || null,
      firstItem?.vendorName || firstItem?.brand || 'N/A',
      firstItem?.productId || null,
      firstItem?.name || 'Unknown Product',
      totalQuantity,
      firstItem?.price || 0,
      calculatedTotal,
      'pending',
      paymentMethod,
      'pending',
      itemsJson,
      notes || null
    ).run();

    const orderId = result.meta.last_row_id;

    // ✅ Optional: Clear cart after order
    // await c.env.DB.prepare(`DELETE FROM cart WHERE userId = ?`).bind(user.id).run();

    return c.json({ 
      success: true, 
      message: 'Order placed successfully',
      order: { 
        id: orderId, 
        orderNumber,
        total: calculatedTotal,
        status: 'pending'
      } 
    }, 201);

  } catch (error) {
    console.error('❌ Error creating order:', error);
    return c.json({ 
      success: false, 
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, 500);
  }
});

// ✅ PATCH /:id/cancel - Cancel order
orders.patch('/:id/cancel', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, message: 'User not authenticated' }, 401);
    }

    const orderId = parseInt(c.req.param('id'));

    const order = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE id = ? AND userId = ?`
    ).bind(orderId, user.id).first();

    if (!order) {
      return c.json({ success: false, message: 'Order not found' }, 404);
    }
    
    if (order.status === 'delivered') {
      return c.json({ success: false, message: 'Cannot cancel delivered order' }, 400);
    }
    
    if (order.status === 'cancelled') {
      return c.json({ success: false, message: 'Order already cancelled' }, 400);
    }

    await c.env.DB.prepare(
      `UPDATE orders SET status = 'cancelled', cancelledAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(orderId).run();

    // ✅ Optionally: Refund if payment was done
    if (order.paymentStatus === 'paid') {
      // Add refund logic here
    }

    return c.json({ 
      success: true, 
      message: 'Order cancelled successfully',
      order: { ...order, status: 'cancelled' } 
    });

  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    return c.json({ success: false, message: 'Failed to cancel order' }, 500);
  }
});

// ✅ PATCH /:id/status - Update order status (Admin/Vendor)
orders.patch('/:id/status', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, message: 'User not authenticated' }, 401);
    }

    const { status } = await c.req.json();
    const validStatuses = ['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return c.json({ success: false, message: 'Invalid status' }, 400);
    }

    const orderId = parseInt(c.req.param('id'));

    // Check if user has permission (admin or vendor)
    let query = `SELECT * FROM orders WHERE id = ?`;
    let params = [orderId];
    
    if (user.role !== 'admin') {
      query += ` AND vendorId = ?`;
      params.push(user.id);
    }

    const order = await c.env.DB.prepare(query).bind(...params).first();

    if (!order) {
      return c.json({ success: false, message: 'Order not found or unauthorized' }, 404);
    }

    // Update status with timestamps
    let updateQuery = `UPDATE orders SET status = ?`;
    let updateParams = [status];
    
    if (status === 'delivered') {
      updateQuery += `, deliveredAt = CURRENT_TIMESTAMP`;
    } else if (status === 'shipped') {
      updateQuery += `, shippedAt = CURRENT_TIMESTAMP`;
    } else if (status === 'confirmed') {
      updateQuery += `, confirmedAt = CURRENT_TIMESTAMP`;
    }
    
    updateQuery += ` WHERE id = ?`;
    updateParams.push(orderId);

    await c.env.DB.prepare(updateQuery).bind(...updateParams).run();

    return c.json({ 
      success: true, 
      message: `Order status updated to ${status}`,
      order: { ...order, status } 
    });

  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return c.json({ success: false, message: 'Failed to update order status' }, 500);
  }
});

// ✅ POST /:id/return - Request return
orders.post('/:id/return', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, message: 'User not authenticated' }, 401);
    }

    const orderId = parseInt(c.req.param('id'));
    const { reason, description } = await c.req.json();

    if (!reason) {
      return c.json({ success: false, message: 'Return reason required' }, 400);
    }

    const order = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE id = ? AND userId = ?`
    ).bind(orderId, user.id).first();

    if (!order) {
      return c.json({ success: false, message: 'Order not found' }, 404);
    }

    if (order.status !== 'delivered') {
      return c.json({ success: false, message: 'Only delivered orders can be returned' }, 400);
    }

    if (order.returnRequested) {
      return c.json({ success: false, message: 'Return already requested' }, 400);
    }

    await c.env.DB.prepare(
      `UPDATE orders SET 
        returnRequested = 1, 
        returnReason = ?, 
        returnDescription = ?,
        returnRequestedAt = CURRENT_TIMESTAMP 
      WHERE id = ?`
    ).bind(reason, description || '', orderId).run();

    return c.json({ 
      success: true, 
      message: 'Return request submitted successfully' 
    });

  } catch (error) {
    console.error('❌ Error requesting return:', error);
    return c.json({ success: false, message: 'Failed to request return' }, 500);
  }
});

export default orders;
