// backend/services/vendorEmailService.js
const { sendEmail } = require('./emailService');

// ============ HELPER: Get Frontend URL ============
const getFrontendUrl = () => {
  return process.env.FRONTEND_URL || 'https://mypinkshop.com';
};

// ============ 1. VENDOR APPROVED ============
const sendVendorApproved = async (vendor) => {
  const subject = '🎉 Welcome to MyPinkShop! Your Vendor Application is Approved';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">🎉</span>
        </div>
        <h1 style="color: #be185d; margin-top: 10px;">MyPinkShop</h1>
        <p style="color: #9ca3af;">Your Beauty Destination</p>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Congratulations! 🎊</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Your vendor application has been <strong style="color: #22c55e;">APPROVED</strong>!
        </p>
        
        <div style="background: #fdf2f8; padding: 15px; border-radius: 12px; margin: 20px 0; text-align: left;">
          <p style="margin: 5px 0;"><strong>Vendor ID:</strong> ${vendor._id}</p>
          <p style="margin: 5px 0;"><strong>Store ID:</strong> ${vendor.storeId || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Brand Name:</strong> ${vendor.brandName}</p>
        </div>
        
        <p style="color: #6b7280; margin-bottom: 20px;">
          You can now login to your vendor dashboard and start selling!
        </p>
        
        <a href="${getFrontendUrl()}/vendor/login" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #be185d); color: white; padding: 12px 35px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          🚀 Go to Vendor Dashboard
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
        <p>Made with 💖 for the girlies</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 2. VENDOR REJECTED ============
const sendVendorRejected = async (vendor, reason = 'Not specified') => {
  const subject = '📝 Your Vendor Application Status Update';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">📝</span>
        </div>
        <h1 style="color: #dc2626; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Application Update</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          We regret to inform you that your vendor application has been <strong style="color: #dc2626;">REJECTED</strong>.
        </p>
        
        <div style="background: #fef2f2; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 5px 0; color: #dc2626;"><strong>Reason:</strong></p>
          <p style="margin: 5px 0; color: #4b5563;">${reason}</p>
        </div>
        
        <p style="color: #6b7280;">
          If you have any questions, please contact our support team.
        </p>
        <p style="color: #6b7280; margin-top: 10px;">
          You can re-apply after addressing the above concerns.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 3. VENDOR BLOCKED ============
const sendVendorBlocked = async (vendor, reason = 'Violation of terms') => {
  const subject = '⚠️ Important: Your Vendor Account has been Blocked';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">⚠️</span>
        </div>
        <h1 style="color: #dc2626; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Account Blocked</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Your vendor account has been <strong style="color: #dc2626;">BLOCKED</strong>.
        </p>
        
        <div style="background: #fef2f2; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 5px 0; color: #dc2626;"><strong>Reason:</strong></p>
          <p style="margin: 5px 0; color: #4b5563;">${reason}</p>
        </div>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <p style="color: #4b5563; margin: 5px 0;"><strong>Next Steps:</strong></p>
          <ul style="color: #4b5563; padding-left: 20px;">
            <li>Contact support at support@mypinkshop.com</li>
            <li>Review our terms and conditions</li>
            <li>Provide required documentation if requested</li>
          </ul>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 4. VENDOR UNBLOCKED ============
const sendVendorUnblocked = async (vendor) => {
  const subject = '✅ Your Vendor Account has been Unblocked';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">✅</span>
        </div>
        <h1 style="color: #16a34a; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Account Unblocked</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Your vendor account has been <strong style="color: #22c55e;">UNBLOCKED</strong>!
        </p>
        
        <p style="color: #6b7280; margin-bottom: 20px;">
          You can now login to your vendor dashboard and resume selling.
        </p>
        
        <a href="${getFrontendUrl()}/vendor/login" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 12px 35px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          🚀 Go to Vendor Dashboard
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 5. NEW ORDER ============
const sendNewOrder = async (vendor, order) => {
  const subject = `🛒 New Order Received - Order #${order.orderNumber || order._id}`;
  
  // Calculate vendor's portion of order
  let vendorTotal = 0;
  let itemCount = 0;
  
  if (order.items && order.items.length > 0) {
    order.items.forEach(item => {
      if (item.vendorId && item.vendorId.toString() === vendor._id.toString()) {
        vendorTotal += item.price * item.quantity;
        itemCount += item.quantity;
      }
    });
  } else {
    vendorTotal = order.total || 0;
    itemCount = order.quantity || 1;
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ec4899, #be185d); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">🛒</span>
        </div>
        <h1 style="color: #be185d; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">New Order! 🎉</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          You have received a new order!
        </p>
        
        <div style="background: #fdf2f8; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.orderNumber || order._id}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.buyerName || order.customerName || 'Guest'}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${vendorTotal.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Items:</strong> ${itemCount} item(s)</p>
          <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt || order.orderDate || Date.now()).toLocaleDateString()}</p>
        </div>
        
        <a href="${getFrontendUrl()}/vendor/orders/${order._id}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #be185d); color: white; padding: 12px 35px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          📦 View Order
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 6. ORDER SHIPPED ============
const sendOrderShipped = async (vendor, order, trackingInfo = {}) => {
  const subject = `📦 Order #${order.orderNumber || order._id} - Shipped!`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">📦</span>
        </div>
        <h1 style="color: #2563eb; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Order Shipped! 🚚</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Your order has been <strong style="color: #3b82f6;">SHIPPED</strong>!
        </p>
        
        <div style="background: #eff6ff; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.orderNumber || order._id}</p>
          <p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingInfo.trackingNumber || order.trackingNumber || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Courier:</strong> ${trackingInfo.courierName || order.courierName || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${trackingInfo.estimatedDelivery || '3-5 business days'}</p>
        </div>
        
        <a href="${getFrontendUrl()}/vendor/orders/${order._id}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 12px 35px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          📋 Track Order
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 7. ORDER DELIVERED ============
const sendOrderDelivered = async (vendor, order) => {
  const subject = `✅ Order #${order.orderNumber || order._id} Delivered Successfully!`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">✅</span>
        </div>
        <h1 style="color: #16a34a; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Order Delivered! 🎉</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Order <strong>#${order.orderNumber || order._id}</strong> has been <strong style="color: #22c55e;">DELIVERED</strong> successfully!
        </p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.orderNumber || order._id}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.buyerName || order.customerName || 'Guest'}</p>
          <p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${new Date(order.deliveredAt || Date.now()).toLocaleDateString()}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 5px 0;">💰 Payment will be credited to your account shortly.</p>
        </div>
        
        <a href="${getFrontendUrl()}/vendor/orders/${order._id}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 12px 35px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          📋 View Order
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 8. LOW STOCK ALERT ============
const sendLowStockAlert = async (vendor, product) => {
  const subject = `⚠️ Low Stock Alert - ${product.name}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">⚠️</span>
        </div>
        <h1 style="color: #d97706; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Low Stock Alert!</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          The following product is running low on stock:
        </p>
        
        <div style="background: #fffbeb; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 5px 0;"><strong>Product:</strong> ${product.name}</p>
          <p style="margin: 5px 0;"><strong>Current Stock:</strong> <span style="color: #dc2626; font-weight: bold;">${product.stock}</span></p>
          <p style="margin: 5px 0;"><strong>Threshold:</strong> ${product.lowStockThreshold || 10}</p>
          <p style="margin: 5px 0;"><strong>SKU:</strong> ${product.sku || 'N/A'}</p>
        </div>
        
        <a href="${getFrontendUrl()}/vendor/products/${product._id}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 12px 35px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          🔄 Update Stock
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 9. PRODUCT APPROVED ============
const sendProductApproved = async (vendor, product) => {
  const subject = `✅ Product Approved - ${product.name}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">✅</span>
        </div>
        <h1 style="color: #16a34a; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Product Approved! 🎉</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Your product has been <strong style="color: #22c55e;">APPROVED</strong> and is now live on MyPinkShop!
        </p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Product:</strong> ${product.name}</p>
          <p style="margin: 5px 0;"><strong>Price:</strong> ₹${product.price}</p>
          <p style="margin: 5px 0;"><strong>Category:</strong> ${product.mainCategory || product.category || 'N/A'}</p>
        </div>
        
        <a href="${getFrontendUrl()}/product/${product.slug || product._id}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 12px 35px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          👁️ View Product
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 10. PRODUCT REJECTED ============
const sendProductRejected = async (vendor, product, reason = 'Not specified') => {
  const subject = `❌ Product Rejected - ${product.name}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">❌</span>
        </div>
        <h1 style="color: #dc2626; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Product Rejected</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          Your product has been <strong style="color: #dc2626;">REJECTED</strong>.
        </p>
        
        <div style="background: #fef2f2; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 5px 0;"><strong>Product:</strong> ${product.name}</p>
          <p style="margin: 5px 0; color: #dc2626;"><strong>Reason:</strong></p>
          <p style="margin: 5px 0; color: #4b5563;">${reason}</p>
        </div>
        
        <a href="${getFrontendUrl()}/vendor/products/${product._id}" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 12px 35px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          ✏️ Edit Product
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 11. RETURN REQUESTED ============
const sendReturnRequested = async (vendor, order, reason) => {
  const subject = `🔄 Return Requested for Order #${order.orderNumber || order._id}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">🔄</span>
        </div>
        <h1 style="color: #d97706; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Return Requested</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          A customer has requested a return for Order <strong>#${order.orderNumber || order._id}</strong>.
        </p>
        
        <div style="background: #fffbeb; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.orderNumber || order._id}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.buyerName || order.customerName || 'Guest'}</p>
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${reason || order.returnReason || 'Not specified'}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${order.total || 0}</p>
        </div>
        
        <a href="${getFrontendUrl()}/vendor/orders/${order._id}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 12px 35px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          📋 Review Return
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 12. RETURN APPROVED ============
const sendReturnApproved = async (vendor, order) => {
  const subject = `✅ Return Approved for Order #${order.orderNumber || order._id}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">✅</span>
        </div>
        <h1 style="color: #16a34a; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Return Approved</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          The return request for Order <strong>#${order.orderNumber || order._id}</strong> has been <strong style="color: #22c55e;">APPROVED</strong>.
        </p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.orderNumber || order._id}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.buyerName || order.customerName || 'Guest'}</p>
          <p style="margin: 5px 0;"><strong>Return Amount:</strong> ₹${order.total || 0}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="color: #92400e; margin: 5px 0;">ℹ️ Refund will be processed within 5-7 business days.</p>
        </div>
        
        <a href="${getFrontendUrl()}/vendor/orders/${order._id}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 12px 35px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          📋 View Order
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ 13. RETURN REJECTED ============
const sendReturnRejected = async (vendor, order, reason = 'Not specified') => {
  const subject = `❌ Return Rejected for Order #${order.orderNumber || order._id}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 15px; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 30px;">❌</span>
        </div>
        <h1 style="color: #dc2626; margin-top: 10px;">MyPinkShop</h1>
      </div>
      
      <div style="background: white; border-radius: 16px; padding: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <h2 style="color: #1f2937; margin-bottom: 20px;">Return Rejected</h2>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 10px;">
          Dear <strong>${vendor.brandName || vendor.name}</strong>,
        </p>
        <p style="color: #4b5563; font-size: 16px; margin-bottom: 20px;">
          The return request for Order <strong>#${order.orderNumber || order._id}</strong> has been <strong style="color: #dc2626;">REJECTED</strong>.
        </p>
        
        <div style="background: #fef2f2; padding: 15px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 5px 0;"><strong>Order ID:</strong> ${order.orderNumber || order._id}</p>
          <p style="margin: 5px 0;"><strong>Customer:</strong> ${order.buyerName || order.customerName || 'Guest'}</p>
          <p style="margin: 5px 0; color: #dc2626;"><strong>Reason:</strong></p>
          <p style="margin: 5px 0; color: #4b5563;">${reason}</p>
        </div>
        
        <a href="${getFrontendUrl()}/vendor/orders/${order._id}" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 12px 35px; border-radius: 25px; text-decoration: none; font-weight: bold;">
          📋 View Order
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
        <p>© 2026 MyPinkShop. All rights reserved.</p>
      </div>
    </div>
  `;

  return await sendEmail(vendor.email, subject, html);
};

// ============ EXPORT ALL FUNCTIONS ============
module.exports = {
  sendVendorApproved,
  sendVendorRejected,
  sendVendorBlocked,
  sendVendorUnblocked,
  sendNewOrder,
  sendOrderShipped,
  sendOrderDelivered,
  sendLowStockAlert,
  sendProductApproved,
  sendProductRejected,
  sendReturnRequested,
  sendReturnApproved,
  sendReturnRejected
};
