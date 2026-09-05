import { Hono } from 'hono';
import { 
  getAllProducts, getProductById, createProduct, updateProduct, deleteProduct,
  getProductsByVendor
} from '../db/queries.js';
import { authMiddleware, vendorOrAdmin } from '../middleware/auth.js';
import { uploadToR2 } from '../utils/r2.js';

const products = new Hono();

products.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit')) || 20;
  const offset = parseInt(c.req.query('offset')) || 0;
  const category = c.req.query('category');
  const minPrice = c.req.query('minPrice') ? parseFloat(c.req.query('minPrice')) : null;
  const maxPrice = c.req.query('maxPrice') ? parseFloat(c.req.query('maxPrice')) : null;
  const search = c.req.query('search');
  
  const productList = await getAllProducts(c.env, limit, offset, {
    category, minPrice, maxPrice, search
  });
  return c.json({ success: true, products: productList });
});

products.get('/:id', async (c) => {
  const id = c.req.param('id');
  const product = await getProductById(c.env, id);
  if (!product) {
    return c.json({ error: 'Product not found' }, 404);
  }
  return c.json({ success: true, product });
});

products.post('/', authMiddleware, vendorOrAdmin, async (c) => {
  const user = c.get('user');
  const formData = await c.req.formData();
  
  const name = formData.get('name');
  const description = formData.get('description');
  const price = parseFloat(formData.get('price'));
  const discounted_price = parseFloat(formData.get('discounted_price')) || null;
  const category = formData.get('category');
  const brand = formData.get('brand') || null;
  const stock = parseInt(formData.get('stock')) || 0;
  
  const images = [];
  const files = formData.getAll('images');
  for (const file of files) {
    if (file instanceof File) {
      const url = await uploadToR2(c.env, file, 'products');
      images.push(url);
    }
  }

  const productId = await createProduct(c.env, {
    name,
    description,
    price,
    discounted_price,
    category,
    brand,
    stock,
    images,
    vendor_id: user.role === 'vendor' ? user.id : null
  });

  return c.json({ success: true, productId });
});

products.put('/:id', authMiddleware, vendorOrAdmin, async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  await updateProduct(c.env, id, data);
  return c.json({ success: true });
});

products.delete('/:id', authMiddleware, vendorOrAdmin, async (c) => {
  const id = c.req.param('id');
  await deleteProduct(c.env, id);
  return c.json({ success: true });
});

// Vendor products
products.get('/vendor/:vendorId', async (c) => {
  const vendorId = c.req.param('vendorId');
  const limit = parseInt(c.req.query('limit')) || 20;
  const offset = parseInt(c.req.query('offset')) || 0;
  const products = await getProductsByVendor(c.env, vendorId, limit, offset);
  return c.json({ success: true, products });
});

export default products;
