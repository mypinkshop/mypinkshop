import { Hono } from 'hono';

const orders = new Hono();

// Helper to parse JSON safely
const safeParse = (str) => {
  try { return JSON.parse(str); } catch { return {}; }
};

// ✅ MUST BE FIRST! /user route ko sabse pehle likhein
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
    return c.json(results);
  } catch (error) {
    console.error('❌ CRITICAL ERROR in /api/orders/user:', error);
    return c.json({ success: false, message: 'Failed to fetch orders' }, 500);
  }
});

// ✅ GET ALL ORDERS (For Admin Panel)
orders.get('/all', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') return c.json({ success: false, message: 'Admin access required' }, 403);

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM orders ORDER BY orderDate DESC`
    ).all();

    return c.json(results);
  } catch (error) {
    console.error('❌ Error fetching all orders:', error);
    return c.json({ success: false, message: 'Failed to fetch orders' }, 500);
  }
});

// ✅ GET ALL RETURNS (For Admin Panel)
orders.get('/returns/all', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') return c.json({ success: false, message: 'Admin access required' }, 403);

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE returnRequested = 1 ORDER BY orderDate DESC`
    ).all();

    return c.json(results);
  } catch (error) {
    console.error('❌ Error fetching returns:', error);
    return c.json({ success: false, message: 'Failed to fetch returns' }, 500);
  }
});

// ✅ THEN :id route aayega
orders.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, message: 'User not authenticated' }, 401);
    }

    const order = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE id = ? AND userId = ?`
    ).bind(parseInt(c.req.param('id')), user.id).first();

    if (!order) {
      return c.json({ success: false, message: 'Order not found' }, 404);
    }

    return c.json(order);
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    return c.json({ success: false, message: 'Failed to fetch order' }, 500);
  }
});

// ✅ POST /api/orders
orders.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, message: 'User not authenticated' }, 401);
    }

    const { items, total, address, paymentMethod, shippingAddress, buyerAddress } = await c.req.json();

    if (!items || items.length === 0) {
      return c.json({ success: false, message: 'No items in order' }, 400);
    }

    const orderNumber = `MPS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Create order in D1
    const result = await c.env.DB.prepare(
      `INSERT INTO orders (orderNumber, buyerId, userId, buyerName, buyerEmail, buyerPhone, buyerAddress, vendorId, vendorName, productId, productName, quantity, price, total, status, paymentMethod, paymentStatus, orderDate, items)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'pending', CURRENT_TIMESTAMP, ?)`
    ).bind(
      orderNumber,
      user.id,
      user.id,
      user.name || address?.fullName || 'Customer',
      user.email,
      user.phone || address?.phone || '',
      JSON.stringify(buyerAddress || shippingAddress || address || {}),
      items[0]?.vendorId || null,
      items[0]?.vendorName || items[0]?.brand || 'N/A',
      items[0]?.productId,
      items[0]?.name,
      items.reduce((sum, item) => sum + item.quantity, 0),
      items[0]?.price || 0,
      total || items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      paymentMethod || 'cod',
      JSON.stringify(items.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        variationName: item.variationName,
        variationSecondary: item.variationSecondary,
        vendorId: item.vendorId || null,
        vendorName: item.vendorName || item.brand || 'N/A'
      })))
    ).run();

    const orderId = result.meta.last_row_id;

    return c.json({ success: true, message: 'Order placed successfully', order: { id: orderId, orderNumber } }, 201);
  } catch (error) {
    console.error('❌ Error creating order:', error);
    return c.json({ success: false, message: 'Failed to create order' }, 500);
  }
});

// ✅ PATCH /api/orders/:id/cancel
orders.patch('/:id/cancel', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, message: 'User not authenticated' }, 401);
    }

    const order = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE id = ? AND userId = ?`
    ).bind(parseInt(c.req.param('id')), user.id).first();

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
    ).bind(parseInt(c.req.param('id'))).run();

    return c.json({ success: true, message: 'Order cancelled successfully', order: { ...order, status: 'cancelled' } });
  } catch (error) {
    console.error('❌ Error cancelling order:', error);
    return c.json({ success: false, message: 'Failed to cancel order' }, 500);
  }
});

// ✅ PATCH /api/orders/:id/status
orders.patch('/:id/status', async (c) => {
  try {
    const user = c.get('user');
    if (!user || !user.id) {
      return c.json({ success: false, message: 'User not authenticated' }, 401);
    }

    const { status } = await c.req.json();
    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return c.json({ success: false, message: 'Invalid status' }, 400);
    }

    const order = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).first();

    if (!order) {
      return c.json({ success: false, message: 'Order not found' }, 404);
    }

    await c.env.DB.prepare(
      `UPDATE orders SET status = ?, deliveredAt = CASE WHEN ? = 'delivered' THEN CURRENT_TIMESTAMP ELSE deliveredAt END WHERE id = ?`
    ).bind(status, status, parseInt(c.req.param('id'))).run();

    return c.json({ success: true, message: `Order status updated to ${status}`, order: { ...order, status } });
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    return c.json({ success: false, message: 'Failed to update order status' }, 500);
  }
});

export default orders;
