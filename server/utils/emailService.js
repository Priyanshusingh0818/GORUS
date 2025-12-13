const SibApiV3Sdk = require('sib-api-v3-sdk');
const fs = require('fs');

// Initialize Brevo API
function initializeBrevo() {
  console.log('🔧 Initializing Brevo API...');
  
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️  No Brevo API key configured!');
    console.warn('⚠️  Please set BREVO_API_KEY in your environment variables.');
    console.warn('⚠️  Orders will still work, but email notifications will be skipped.');
    return null;
  }

  try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKeyAuth = defaultClient.authentications['api-key'];
    apiKeyAuth.apiKey = apiKey;
    
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    console.log('✅ Brevo API initialized successfully');
    return apiInstance;
  } catch (error) {
    console.error('❌ Failed to initialize Brevo API:', error.message);
    return null;
  }
}

// Send order notification email to admin
async function sendOrderNotificationEmail(orderData) {
  console.log('\n📧 ==========================================');
  console.log('📧 Order Notification Email Triggered');
  console.log('📧 ==========================================');
  
  const apiInstance = initializeBrevo();
  
  if (!apiInstance) {
    console.warn('⚠️  Brevo API not available. Skipping email notification.');
    console.warn('⚠️  Order was created successfully.');
    return { success: false, error: 'Brevo API not configured', skipped: true };
  }

  // Get email addresses from environment
  const fromEmail = process.env.SENDER_EMAIL || 'noreply@goras.com';
  const fromName = process.env.SENDER_NAME || 'GORAS Orders';
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'admin@goras.com';
  
  const { order, customer, items } = orderData;

  console.log(`📧 From: ${fromName} <${fromEmail}>`);
  console.log(`📧 To: ${adminEmail}`);
  console.log(`📧 Order Number: ${order.order_number}`);

  // Format order items
  const itemsList = items.map(item => 
    `  • ${item.product_name} - ${item.quantity} × ₹${item.product_price} = ₹${item.subtotal.toFixed(2)}`
  ).join('\n');

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .order-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #374151; }
        .items { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .total { background-color: #22c55e; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; border-radius: 5px; margin-top: 15px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛒 New Order Received</h1>
        </div>
        <div class="content">
          <div class="order-info">
            <h2>Order Details</h2>
            <div class="info-row">
              <span class="label">Order Number:</span> ${order.order_number}
            </div>
            <div class="info-row">
              <span class="label">Order Date:</span> ${new Date(order.created_at).toLocaleString('en-IN')}
            </div>
            <div class="info-row">
              <span class="label">Payment Method:</span> ${order.payment_method.toUpperCase()}
            </div>
            <div class="info-row">
              <span class="label">Status:</span> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>

          <div class="order-info">
            <h2>Customer Information</h2>
            <div class="info-row">
              <span class="label">Name:</span> ${customer.name || 'N/A'}
            </div>
            <div class="info-row">
              <span class="label">Email:</span> ${customer.email || 'N/A'}
            </div>
            <div class="info-row">
              <span class="label">Phone:</span> ${order.shipping_phone || 'N/A'}
            </div>
          </div>

          <div class="order-info">
            <h2>Shipping Address</h2>
            <div class="info-row">
              <span class="label">Name:</span> ${order.shipping_name}
            </div>
            <div class="info-row">
              <span class="label">Address:</span> ${order.shipping_address}
            </div>
            <div class="info-row">
              <span class="label">Phone:</span> ${order.shipping_phone}
            </div>
          </div>

          <div class="items">
            <h2>Order Items</h2>
            <pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${itemsList}</pre>
          </div>

          <div class="total">
            Total Amount: ₹${order.total_amount.toFixed(2)}
          </div>
        </div>
        <div class="footer">
          <p>This is an automated notification from GORAS Dairy E-commerce System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailText = `
New Order Received - ${order.order_number}

Order Details:
- Order Number: ${order.order_number}
- Order Date: ${new Date(order.created_at).toLocaleString('en-IN')}
- Payment Method: ${order.payment_method.toUpperCase()}
- Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}

Customer Information:
- Name: ${customer.name || 'N/A'}
- Email: ${customer.email || 'N/A'}
- Phone: ${order.shipping_phone || 'N/A'}

Shipping Address:
- Name: ${order.shipping_name}
- Address: ${order.shipping_address}
- Phone: ${order.shipping_phone}

Order Items:
${itemsList}

Total Amount: ₹${order.total_amount.toFixed(2)}

---
This is an automated notification from GORAS Dairy E-commerce System
  `;

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.sender = { name: fromName, email: fromEmail };
  sendSmtpEmail.to = [{ email: adminEmail }];
  sendSmtpEmail.subject = `🛒 New Order: ${order.order_number} - ₹${order.total_amount.toFixed(2)}`;
  sendSmtpEmail.htmlContent = emailHtml;
  sendSmtpEmail.textContent = emailText;

  try {
    console.log('📤 Sending email via Brevo...');
    
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log('✅ ==========================================');
    console.log('✅ ORDER EMAIL SENT SUCCESSFULLY!');
    console.log('✅ ==========================================');
    console.log(`   Message ID: ${data.messageId}`);
    console.log(`   To: ${adminEmail}`);
    console.log('✅ ==========================================\n');
    
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ ==========================================');
    console.error('❌ FAILED TO SEND ORDER EMAIL');
    console.error('❌ ==========================================');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.body || error.response.text));
    }
    console.error('❌ ==========================================');
    console.warn('⚠️  Order was created successfully despite email error');
    console.error('❌ ==========================================\n');
    
    return { success: false, error: error.message, skipped: true };
  }
}

// Send UPI payment confirmation email with screenshot
async function sendUPIPaymentEmail(orderData) {
  console.log('\n📧 ==========================================');
  console.log('📧 UPI Payment Email Triggered');
  console.log('📧 ==========================================');
  
  const apiInstance = initializeBrevo();
  
  if (!apiInstance) {
    console.warn('⚠️  Brevo API not available. Skipping email notification.');
    return { success: false, error: 'Brevo API not configured', skipped: true };
  }

  const fromEmail = process.env.SENDER_EMAIL || 'noreply@goras.com';
  const fromName = process.env.SENDER_NAME || 'GORAS Orders';
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'admin@goras.com';
  
  const { order, customer, items, paymentProofPath, phone } = orderData;

  console.log(`📧 From: ${fromName} <${fromEmail}>`);
  console.log(`📧 To: ${adminEmail}`);
  console.log(`📧 Order Number: ${order.order_number}`);
  console.log(`📧 Attachment: ${paymentProofPath ? 'Yes' : 'No'}`);

  const totalAmount = typeof order.total_amount === 'number' 
    ? order.total_amount 
    : parseFloat(order.total_amount) || 0;

  const itemsList = items.map(item => 
    `  • ${item.product_name} - ${item.quantity} × ₹${item.product_price} = ₹${item.subtotal.toFixed(2)}`
  ).join('\n');

  // Convert attachment to Base64 for Brevo
  let attachments = [];
  if (paymentProofPath && fs.existsSync(paymentProofPath)) {
    try {
      const fileContent = fs.readFileSync(paymentProofPath);
      const base64Content = fileContent.toString('base64');
      const fileName = order.payment_proof || 'payment-proof.jpg';
      
      attachments.push({
        content: base64Content,
        name: fileName
      });
      
      console.log(`📎 Attaching payment proof: ${fileName}`);
    } catch (err) {
      console.error('❌ Failed to read payment proof file:', err.message);
    }
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .upi-badge { background-color: #fbbf24; color: #78350f; padding: 10px 20px; border-radius: 20px; display: inline-block; font-weight: bold; margin: 10px 0; }
        .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .order-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .info-row { margin: 10px 0; }
        .label { font-weight: bold; color: #374151; }
        .items { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .total { background-color: #22c55e; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; border-radius: 5px; margin-top: 15px; }
        .warning { background-color: #fef3c7; border-left: 4px solid #fbbf24; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 UPI Payment Received</h1>
          <div class="upi-badge">PAYMENT SCREENSHOT ATTACHED</div>
        </div>
        <div class="content">
          <div class="warning">
            <strong>⚠️ Action Required:</strong> Customer has uploaded a payment screenshot. Please verify the payment and update the order status accordingly.
          </div>

          <div class="order-info">
            <h2>Order Details</h2>
            <div class="info-row">
              <span class="label">Order Number:</span> ${order.order_number}
            </div>
            <div class="info-row">
              <span class="label">Order Date:</span> ${new Date(order.created_at).toLocaleString('en-IN')}
            </div>
            <div class="info-row">
              <span class="label">Payment Method:</span> <strong style="color: #22c55e;">UPI</strong>
            </div>
            <div class="info-row">
              <span class="label">Payment Status:</span> Pending Verification
            </div>
          </div>

          <div class="order-info">
            <h2>Customer Information</h2>
            <div class="info-row">
              <span class="label">Name:</span> ${customer.name || 'N/A'}
            </div>
            <div class="info-row">
              <span class="label">Email:</span> ${customer.email || 'N/A'}
            </div>
            <div class="info-row">
              <span class="label">Phone:</span> ${phone || order.shipping_phone || 'N/A'}
            </div>
          </div>

          <div class="order-info">
            <h2>Shipping Address</h2>
            <div class="info-row">
              <span class="label">Name:</span> ${order.shipping_name}
            </div>
            <div class="info-row">
              <span class="label">Address:</span> ${order.shipping_address}
            </div>
            <div class="info-row">
              <span class="label">Phone:</span> ${order.shipping_phone}
            </div>
          </div>

          <div class="items">
            <h2>Order Items</h2>
            <pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${itemsList}</pre>
          </div>

          <div class="total">
            Amount Paid: ₹${totalAmount.toFixed(2)}
          </div>
        </div>
        <div class="footer">
          <p>Payment screenshot is attached to this email.</p>
          <p>This is an automated notification from GORAS Dairy E-commerce System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailText = `
🔔 UPI PAYMENT RECEIVED - Order ${order.order_number}

⚠️ ACTION REQUIRED: Customer has uploaded payment screenshot (attached). Please verify and update order status.

Order Details:
- Order Number: ${order.order_number}
- Order Date: ${new Date(order.created_at).toLocaleString('en-IN')}
- Payment Method: UPI
- Payment Status: Pending Verification

Customer Information:
- Name: ${customer.name || 'N/A'}
- Email: ${customer.email || 'N/A'}
- Phone: ${phone || order.shipping_phone || 'N/A'}

Shipping Address:
- Name: ${order.shipping_name}
- Address: ${order.shipping_address}
- Phone: ${order.shipping_phone}

Order Items:
${itemsList}

Amount Paid: ₹${totalAmount.toFixed(2)}

Payment screenshot is attached to this email.
---
This is an automated notification from GORAS Dairy E-commerce System
  `;

  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.sender = { name: fromName, email: fromEmail };
  sendSmtpEmail.to = [{ email: adminEmail }];
  sendSmtpEmail.subject = `💰 UPI Payment - ${order.order_number} - ₹${totalAmount.toFixed(2)} [VERIFY]`;
  sendSmtpEmail.htmlContent = emailHtml;
  sendSmtpEmail.textContent = emailText;
  
  if (attachments.length > 0) {
    sendSmtpEmail.attachment = attachments;
  }

  try {
    console.log('📤 Sending UPI payment email via Brevo...');
    
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log('✅ ==========================================');
    console.log('✅ UPI EMAIL SENT SUCCESSFULLY!');
    console.log('✅ ==========================================');
    console.log(`   Message ID: ${data.messageId}`);
    console.log(`   To: ${adminEmail}`);
    console.log('✅ ==========================================\n');
    
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('❌ ==========================================');
    console.error('❌ FAILED TO SEND UPI EMAIL');
    console.error('❌ ==========================================');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response.body || error.response.text));
    }
    console.error('❌ ==========================================');
    console.warn('⚠️  Order was processed successfully despite email error');
    console.error('❌ ==========================================\n');
    
    return { success: false, error: error.message, skipped: true };
  }
}

module.exports = {
  sendOrderNotificationEmail,
  sendUPIPaymentEmail,
};
