import { Hono } from 'hono';

const offers = new Hono();

// Helper to check if user is admin
const isAdmin = (c) => {
  const user = c.get('user');
  return user && user.role === 'admin';
};

// ✅ Get active offer for top banner (Public)
offers.get('/active-offer', async (c) => {
  try {
    console.log('🔥 GET /active-offer called');
    const currentDate = new Date().toISOString();
    console.log('Current date:', currentDate);
    
    const offer = await c.env.DB.prepare(
      `SELECT * FROM offers 
       WHERE isActive = 1 AND type = 'top_banner' 
       AND startDate <= ? 
       AND (endDate IS NULL OR endDate >= ?)
       ORDER BY createdAt DESC LIMIT 1`
    ).bind(currentDate, currentDate).first();
    
    console.log('Found offer:', offer);
    
    return c.json(offer || {
      title: 'Free Shipping',
      description: 'FREE SHIPPING ON ORDERS ABOVE ₹999 • EXTRA 10% OFF ON FIRST ORDER',
      discountValue: 10,
      minOrderValue: 999
    });
  } catch (error) {
    console.error('Error in /active-offer:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ✅ Get all offers (Admin only)
offers.get('/all', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('🔥 GET /all called');
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM offers ORDER BY createdAt DESC`
    ).all();
    console.log(`Found ${results.length} offers`);
    return c.json(results);
  } catch (error) {
    console.error('Error in /all:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ✅ Create new offer (Admin only)
offers.post('/create', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('🔥 POST /create called');
    const { title, description, discountType, discountValue, minOrderValue, startDate, endDate, type } = await c.req.json();
    
    // Validation
    if (!title || !description) {
      return c.json({ error: 'Title and description are required' }, 400);
    }
    
    const result = await c.env.DB.prepare(
      `INSERT INTO offers (title, description, type, discountType, discountValue, minOrderValue, startDate, endDate, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
    ).bind(
      title,
      description,
      type || 'top_banner',
      discountType || 'percentage',
      discountValue || 10,
      minOrderValue || 999,
      startDate || new Date().toISOString(),
      endDate || null
    ).run();

    const offerId = result.meta.last_row_id;
    
    console.log('Offer saved:', offerId);
    return c.json({ success: true, offer: { id: offerId } }, 201);
  } catch (error) {
    console.error('Error in /create:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ✅ Update offer (Admin only)
offers.put('/update/:id', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('🔥 PUT /update called for id:', c.req.param('id'));
    const { title, description, discountType, discountValue, minOrderValue, startDate, endDate, isActive } = await c.req.json();
    
    const offer = await c.env.DB.prepare(
      `SELECT * FROM offers WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).first();
    
    if (!offer) {
      return c.json({ error: 'Offer not found' }, 404);
    }
    
    await c.env.DB.prepare(
      `UPDATE offers SET title = ?, description = ?, discountType = ?, discountValue = ?, minOrderValue = ?, startDate = ?, endDate = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(
      title,
      description,
      discountType,
      discountValue,
      minOrderValue,
      startDate,
      endDate,
      isActive ? 1 : 0,
      parseInt(c.req.param('id'))
    ).run();

    console.log('Offer updated:', offer.id);
    return c.json({ success: true, offer: { ...offer, title, description, discountType, discountValue, minOrderValue, startDate, endDate, isActive } });
  } catch (error) {
    console.error('Error in /update:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ✅ Toggle offer status (Admin only)
offers.patch('/toggle/:id', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('🔥 PATCH /toggle called for id:', c.req.param('id'));
    const offer = await c.env.DB.prepare(
      `SELECT * FROM offers WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).first();
    
    if (!offer) {
      return c.json({ error: 'Offer not found' }, 404);
    }
    
    const newStatus = offer.isActive ? 0 : 1;
    await c.env.DB.prepare(
      `UPDATE offers SET isActive = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(newStatus, parseInt(c.req.param('id'))).run();
    
    console.log('Offer toggled, isActive:', newStatus);
    return c.json({ success: true, isActive: newStatus });
  } catch (error) {
    console.error('Error in /toggle:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ✅ Delete offer (Admin only)
offers.delete('/delete/:id', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ error: 'Admin access required' }, 403);
    }

    console.log('🔥 DELETE /delete called for id:', c.req.param('id'));
    const offer = await c.env.DB.prepare(
      `SELECT * FROM offers WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).first();
    
    if (!offer) {
      return c.json({ error: 'Offer not found' }, 404);
    }
    
    await c.env.DB.prepare(
      `DELETE FROM offers WHERE id = ?`
    ).bind(parseInt(c.req.param('id'))).run();
    
    console.log('Offer deleted:', offer.id);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error in /delete:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default offers;
