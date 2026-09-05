import { Hono } from 'hono';

const banners = new Hono();

// GET active hero banner for homepage
banners.get('/homepage/hero-banner', async (c) => {
  try {
    // D1 Database se query (SQLite syntax)
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM banners 
       WHERE isActive = 1 AND position = 'hero' 
       ORDER BY createdAt DESC LIMIT 1`
    ).all();

    // Agar banner nahi mila toh default banner
    if (!results || results.length === 0) {
      return c.json({
        title: 'Shop t-shirts & polos',
        subtitle: 'Under ₹399',
        cashback: '5% cashback with ICICI card*',
        imageUrl: '/default-banner.jpg',
        ctaLink: '/shop'
      });
    }

    return c.json(results[0]);
  } catch (error) {
    console.error("Banner Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// POST add new banner (admin)
banners.post('/admin/banners', async (c) => {
  try {
    const { title, subtitle, cashback, ctaLink, position } = await c.req.json();
    // Note: Cloudflare Workers mein file upload ke liye `c.req.parseBody()` use hota hai, 
    // aur files ko R2 storage mein save karna padta hai. Yahan hum imageUrl ko null maan rahe hain 
    // ya aap R2 ka URL pass kar sakte ho.
    const imageUrl = null; // Ya R2 URL yahan daalo

    // D1 Database mein insert (SQLite syntax)
    const result = await c.env.DB.prepare(
      `INSERT INTO banners (title, subtitle, cashback, ctaLink, position, imageUrl, isActive) 
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    ).bind(title, subtitle, cashback, ctaLink, position, imageUrl).run();

    const newBanner = {
      id: result.meta.last_row_id,
      title,
      subtitle,
      cashback,
      ctaLink,
      position,
      imageUrl,
      isActive: true
    };

    return c.json({ success: true, banner: newBanner });
  } catch (error) {
    console.error("Banner Create Error:", error);
    return c.json({ error: error.message }, 500);
  }
});

export default banners;
