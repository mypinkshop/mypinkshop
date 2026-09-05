import { Hono } from 'hono';

const bulkUpload = new Hono();

// Endpoint: /api/bulk-upload
bulkUpload.post('/bulk-upload', async (c) => {
  try {
    // 1. Authentication check (Hono ke hisaab se apna auth middleware use karo)
    const user = c.get('user'); // Assume karo ki middleware ne user set kar diya hai
    if (!user) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    // 2. FormData se file nikalo (multer ki jagah)
    const formData = await c.req.formData();
    const file = formData.get('file'); // 'file' naam se file aayegi

    if (!file || !(file instanceof File)) {
      return c.json({ success: false, message: 'No file uploaded. Please attach a CSV file.' }, 400);
    }

    // 3. File ka naam aur type check karo
    const fileName = file.name;
    const fileType = file.type;

    // 4. CSV file ka content read karo
    const fileText = await file.text(); // Ye line file ko text mein convert kar degi

    // 5. Ab file ko process karo (Ye CSV parsing ka kaam hai)
    // Yahan apna CSV parsing logic likho ya kisi library ka use karo
    const products = parseCSV(fileText, user.id); // Main neeche parseCSV function de raha hoon

    // 6. D1 Database mein products insert karo
    for (const product of products) {
      await c.env.DB.prepare(
        `INSERT INTO products (vendorId, name, price, images) VALUES (?, ?, ?, ?)`
      ).bind(user.id, product.name, product.price, JSON.stringify(product.images)).run();
    }

    // 7. Agar cloudflare workers mein R2 storage hai, toh file ko R2 mein bhi save kar sakte ho (optional)
    // await c.env.BUCKET.put(`uploads/${Date.now()}-${fileName}`, file);

    return c.json({
      success: true,
      message: `Successfully uploaded and processed ${products.length} products`,
      products
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// CSV Parser function (Simple example)
function parseCSV(text, vendorId) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  
  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index].trim();
      });
      
      // Simple validation
      if (obj.name && obj.price) {
        products.push({
          vendorId,
          name: obj.name,
          price: parseFloat(obj.price),
          images: obj.images ? obj.images.split('|') : []
        });
      }
    }
  }
  return products;
}

export default bulkUpload;
