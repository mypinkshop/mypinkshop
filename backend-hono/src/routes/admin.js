import { Hono } from 'hono';

const admin = new Hono();

// Helper function to check if user is admin
const isAdmin = (c) => {
  const user = c.get('user');
  return user && user.role === 'admin';
};

// @route GET /api/admin/dashboard
// Get admin dashboard stats
admin.get('/dashboard', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ message: 'Admin access required' }, 403);
    }

    const totalUsers = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM users`).first();
    const totalVendors = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'vendor'`).first();
    const totalBuyers = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'buyer'`).first();
    const totalProducts = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM products`).first();
    const totalOrders = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM orders`).first();
    
    const pendingVendors = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM users WHERE role = 'vendor' AND vendorStatus = 'pending'`).first();
    
    // Calculate total earnings (admin commission)
    const earnings = await c.env.DB.prepare(`SELECT SUM(commission) as totalEarnings FROM orders`).first();
    
    // Recent orders
    const recentOrders = await c.env.DB.prepare(
      `SELECT o.*, u.name as buyerName, u.email as buyerEmail, v.name as vendorName, v.brandName as brandName 
       FROM orders o 
       LEFT JOIN users u ON o.buyerId = u.id 
       LEFT JOIN users v ON o.vendorId = v.id 
       ORDER BY o.orderDate DESC LIMIT 5`
    ).all();

    return c.json({
      totalUsers: totalUsers.count,
      totalVendors: totalVendors.count,
      totalBuyers: totalBuyers.count,
      totalProducts: totalProducts.count,
      totalOrders: totalOrders.count,
      pendingVendors: pendingVendors.count,
      totalEarnings: earnings?.totalEarnings || 0,
      recentOrders: recentOrders.results
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return c.json({ message: error.message }, 500);
  }
});

// @route GET /api/admin/vendors
// Get all vendors
admin.get('/vendors', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ message: 'Admin access required' }, 403);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM users WHERE role = 'vendor' ORDER BY createdAt DESC`
    ).all();

    return c.json(results);
  } catch (error) {
    console.error('Get vendors error:', error);
    return c.json({ message: error.message }, 500);
  }
});

// @route PUT /api/admin/vendors/:id/approve
// Approve vendor
admin.put('/vendors/:id/approve', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ message: 'Admin access required' }, 403);
    }

    const vendor = await c.env.DB.prepare(
      `SELECT * FROM users WHERE id = ? AND role = 'vendor'`
    ).bind(parseInt(c.req.param('id'))).first();

    if (!vendor) {
      return c.json({ message: 'Vendor not found' }, 404);
    }

    await c.env.DB.prepare(
      `UPDATE users SET vendorStatus = 'approved' WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).run();

    return c.json({ message: 'Vendor approved successfully', vendor: { ...vendor, vendorStatus: 'approved' } });
  } catch (error) {
    console.error('Approve vendor error:', error);
    return c.json({ message: error.message }, 500);
  }
});

// @route PUT /api/admin/vendors/:id/block
// Block vendor
admin.put('/vendors/:id/block', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ message: 'Admin access required' }, 403);
    }

    const vendor = await c.env.DB.prepare(
      `SELECT * FROM users WHERE id = ? AND role = 'vendor'`
    ).bind(parseInt(c.req.param('id'))).first();

    if (!vendor) {
      return c.json({ message: 'Vendor not found' }, 404);
    }

    await c.env.DB.prepare(
      `UPDATE users SET vendorStatus = 'blocked' WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).run();

    // Also block all products of this vendor
    await c.env.DB.prepare(
      `UPDATE products SET status = 'inactive' WHERE vendorId = ?`
    ).bind(parseInt(c.req.param('id'))).run();

    return c.json({ message: 'Vendor blocked successfully', vendor: { ...vendor, vendorStatus: 'blocked' } });
  } catch (error) {
    console.error('Block vendor error:', error);
    return c.json({ message: error.message }, 500);
  }
});

// @route GET /api/admin/products
// Get all products (admin)
admin.get('/products', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ message: 'Admin access required' }, 403);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT p.*, u.name as vendorName, u.brandName, u.email as vendorEmail 
       FROM products p 
       LEFT JOIN users u ON p.vendorId = u.id 
       ORDER BY p.createdAt DESC`
    ).all();

    return c.json(results);
  } catch (error) {
    console.error('Get products error:', error);
    return c.json({ message: error.message }, 500);
  }
});

// @route PUT /api/admin/products/:id/toggle
// Toggle product status (active/inactive)
admin.put('/products/:id/toggle', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ message: 'Admin access required' }, 403);
    }

    const product = await c.env.DB.prepare(
      `SELECT * FROM products WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).first();

    if (!product) {
      return c.json({ message: 'Product not found' }, 404);
    }

    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    await c.env.DB.prepare(
      `UPDATE products SET status = ? WHERE id = ?`
    ).bind(newStatus, parseInt(c.req.param('id'))).run();

    return c.json({ message: `Product ${newStatus}`, product: { ...product, status: newStatus } });
  } catch (error) {
    console.error('Toggle product error:', error);
    return c.json({ message: error.message }, 500);
  }
});

// @route GET /api/admin/orders
// Get all orders (admin)
admin.get('/orders', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ message: 'Admin access required' }, 403);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT o.*, u.name as buyerName, u.email as buyerEmail, v.name as vendorName, v.brandName as brandName 
       FROM orders o 
       LEFT JOIN users u ON o.buyerId = u.id 
       LEFT JOIN users v ON o.vendorId = v.id 
       ORDER BY o.orderDate DESC`
    ).all();

    return c.json(results);
  } catch (error) {
    console.error('Get orders error:', error);
    return c.json({ message: error.message }, 500);
  }
});

// @route PUT /api/admin/orders/:id/status
// Update order status (admin)
admin.put('/orders/:id/status', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ message: 'Admin access required' }, 403);
    }

    const { status } = await c.req.json();
    const order = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).first();

    if (!order) {
      return c.json({ message: 'Order not found' }, 404);
    }

    await c.env.DB.prepare(
      `UPDATE orders SET status = ?, deliveredAt = CASE WHEN ? = 'delivered' THEN CURRENT_TIMESTAMP ELSE deliveredAt END WHERE id = ?`
    ).bind(status, status, parseInt(c.req.param('id'))).run();

    return c.json({ message: `Order status updated to ${status}`, order: { ...order, status } });
  } catch (error) {
    console.error('Update order status error:', error);
    return c.json({ message: error.message }, 500);
  }
});

export default admin;
