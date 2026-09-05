import { Hono } from 'hono';
import { createAddress, getAddressesByUser, updateAddress, deleteAddress } from '../db/queries.js';
import { authMiddleware } from '../middleware/auth.js';

const addresses = new Hono();

addresses.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const addressList = await getAddressesByUser(c.env, user.id);
  return c.json({ success: true, addresses: addressList });
});

addresses.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const data = await c.req.json();
  data.user_id = user.id;
  
  const id = await createAddress(c.env, data);
  return c.json({ success: true, id });
});

addresses.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const data = await c.req.json();
  await updateAddress(c.env, id, data);
  return c.json({ success: true });
});

addresses.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  await deleteAddress(c.env, id);
  return c.json({ success: true });
});

export default addresses;
