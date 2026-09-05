import { Hono } from 'hono';
import {
  createBanner,
  getBanner,
  getAllBanners,
  getActiveBanners,
  updateBanner,
  deleteBanner,
  toggleBannerActive
} from '../models/Banner.js';

const banners = new Hono();

// Helper: Check if user is admin
const isAdmin = (c) => {
  const user = c.get('user');
  return user && user.role === 'admin';
};

// ========== GET ACTIVE BANNERS (Public) ==========
banners.get('/active', async (c) => {
  try {
    const { limit = 5 } = c.req.query();
    const results = await getActiveBanners(c.env.DB, parseInt(limit));
    return c.json({ success: true, banners: results });
  } catch (error) {
    console.error('Get active banners error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========== GET ALL BANNERS (Admin) ==========
banners.get('/all', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const { page = 1, limit = 20 } = c.req.query();
    const { banners: allBanners, total, currentPage, totalPages } = await getAllBanners(c.env.DB, parseInt(page), parseInt(limit));

    return c.json({
      success: true,
      banners: allBanners,
      pagination: {
        currentPage,
        totalPages,
        totalBanners: total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all banners error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========== GET SINGLE BANNER (Admin) ==========
banners.get('/:id', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const banner = await getBanner(c.env.DB, parseInt(c.req.param('id')));

    if (!banner) {
      return c.json({ success: false, message: 'Banner not found' }, 404);
    }

    return c.json({ success: true, banner });
  } catch (error) {
    console.error('Get banner error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========== CREATE BANNER (Admin) ==========
banners.post('/', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const data = await c.req.json();

    if (!data.title) {
      return c.json({ success: false, message: 'Title is required' }, 400);
    }

    const bannerId = await createBanner(c.env.DB, data);
    const banner = await getBanner(c.env.DB, bannerId);

    return c.json({ success: true, banner }, 201);
  } catch (error) {
    console.error('Create banner error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========== UPDATE BANNER (Admin) ==========
banners.put('/:id', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const data = await c.req.json();
    const result = await updateBanner(c.env.DB, parseInt(c.req.param('id')), data);

    if (!result) {
      return c.json({ success: false, message: 'Banner not found' }, 404);
    }

    return c.json({ success: true, banner: result });
  } catch (error) {
    console.error('Update banner error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========== TOGGLE ACTIVE (Admin) ==========
banners.patch('/:id/toggle', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const result = await toggleBannerActive(c.env.DB, parseInt(c.req.param('id')));

    if (!result) {
      return c.json({ success: false, message: 'Banner not found' }, 404);
    }

    return c.json({ success: true, banner: result });
  } catch (error) {
    console.error('Toggle banner error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ========== DELETE BANNER (Admin) ==========
banners.delete('/:id', async (c) => {
  try {
    if (!isAdmin(c)) {
      return c.json({ success: false, message: 'Admin access required' }, 403);
    }

    const result = await deleteBanner(c.env.DB, parseInt(c.req.param('id')));

    if (!result) {
      return c.json({ success: false, message: 'Banner not found' }, 404);
    }

    return c.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default banners;
