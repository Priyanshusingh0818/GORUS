const SibApiV3Sdk = require('sib-api-v3-sdk');
const nodemailer = require('nodemailer');
const fs = require('fs');

// Initialize Brevo API
function initializeBrevo() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return null;

  try {
    const defaultClient = SibApiV3Sdk.ApiClient.instance;
    const apiKeyAuth = defaultClient.authentications['api-key'];
    apiKeyAuth.apiKey = apiKey;
    return new SibApiV3Sdk.TransactionalEmailsApi();
  } catch (error) {
    console.error('❌ Failed to initialize Brevo API:', error.message);
    return null;
  }
}

// Send Email abstraction to handle both Brevo and Nodemailer (Gmail)
async function sendEmail({ to, subject, htmlContent, textContent, attachments = [] }) {
  const fromEmail = process.env.SENDER_EMAIL || process.env.GMAIL_USER || 'noreply@goras.com';
  const fromName = process.env.SENDER_NAME || 'GORAS Orders';

  const brevoApi = initializeBrevo();

  if (brevoApi) {
    console.log('📤 Sending email via Brevo...');
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = { name: fromName, email: fromEmail };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;
    
    if (attachments.length > 0) {
      sendSmtpEmail.attachment = attachments.map(att => ({
        name: att.filename,
        content: att.content // Base64 string expected by Brevo
      }));
    }

    const data = await brevoApi.sendTransacEmail(sendSmtpEmail);
    return { success: true, messageId: data.messageId };
  } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    console.log('📤 Sending email via Gmail (Nodemailer)...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html: htmlContent,
      text: textContent,
      attachments: attachments.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64')
      }))
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } else {
    throw new Error('No email service configured (Missing Brevo API key or Gmail credentials)');
  }
}

// Send order notification email to admin
async function sendOrderNotificationEmail(orderData) {
  console.log('\n📧 ==========================================');
  console.log('📧 Order Notification Email Triggered');
  console.log('📧 ==========================================');
  
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'admin@goras.com';
  const { order, customer, items } = orderData;

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

  try {
    const data = await sendEmail({
      to: adminEmail,
      subject: `🛒 New Order: ${order.order_number} - ₹${order.total_amount.toFixed(2)}`,
      htmlContent: emailHtml,
      textContent: emailText
    });

    console.log('✅ ==========================================');
    console.log('✅ ORDER EMAIL SENT SUCCESSFULLY!');
    console.log('✅ ==========================================');
    console.log(`   Message ID: ${data.messageId}`);
    console.log(`   To: ${adminEmail}`);
    console.log('✅ ==========================================\n');
    
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.warn('\n⚠️  Failed to send email notification:', error.message);
    console.warn('⚠️  Order was created successfully despite email error.\n');
    return { success: false, error: error.message, skipped: true };
  }
}

// Send order confirmation email to customer
async function sendCustomerOrderConfirmationEmail(orderData) {
  const { order, customer, items } = orderData;
  const customerEmail = customer.email;

  if (!customerEmail || customerEmail === 'N/A') {
    return { success: false, skipped: true, error: 'No email address' };
  }

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
        .items { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
        .total { background-color: #22c55e; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; border-radius: 5px; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Thank You For Your Order!</h1>
        </div>
        <div class="content">
          <p>Hi ${customer.name || 'Customer'},</p>
          <p>We have received your order <strong>#${order.order_number}</strong>.</p>
          <div class="items">
            <h2>Order Items</h2>
            <pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${itemsList}</pre>
          </div>
          <div class="total">
            Total Amount: ₹${order.total_amount.toFixed(2)}
          </div>
          <p>We will notify you once your order is shipped.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailText = `
Thank You For Your Order!
Hi ${customer.name || 'Customer'},
We have received your order #${order.order_number}.

Order Items:
${itemsList}

Total Amount: ₹${order.total_amount.toFixed(2)}
We will notify you once your order is shipped.
  `;

  try {
    const data = await sendEmail({
      to: customerEmail,
      subject: `Order Confirmed: ${order.order_number}`,
      htmlContent: emailHtml,
      textContent: emailText
    });
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('Failed to send customer email:', error);
    return { success: false, error: error.message };
  }
}

// Send UPI payment confirmation email with screenshot
async function sendUPIPaymentEmail(orderData) {
  console.log('\n📧 ==========================================');
  console.log('📧 UPI Payment Email Triggered');
  console.log('📧 ==========================================');
  
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'admin@goras.com';
  const { order, customer, items, paymentProofPath, phone } = orderData;

  console.log(`📧 To: ${adminEmail}`);
  console.log(`📧 Order Number: ${order.order_number}`);
  console.log(`📧 Attachment: ${paymentProofPath ? 'Yes' : 'No'}`);

  const totalAmount = typeof order.total_amount === 'number' 
    ? order.total_amount 
    : parseFloat(order.total_amount) || 0;

  const itemsList = items.map(item => 
    `  • ${item.product_name} - ${item.quantity} × ₹${item.product_price} = ₹${item.subtotal.toFixed(2)}`
  ).join('\n');

  // Load attachment
  let attachments = [];
  if (paymentProofPath) {
    try {
      let base64Content = null;
      let fileName = order.payment_proof ? order.payment_proof.split('/').pop().split('?')[0] : 'payment-proof.jpg';
      if (!fileName.includes('.')) fileName += '.jpg';

      if (paymentProofPath.startsWith('http')) {
        const response = await fetch(paymentProofPath);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          base64Content = Buffer.from(arrayBuffer).toString('base64');
        } else {
          throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
        }
      } else if (fs.existsSync(paymentProofPath)) {
        const fileContent = fs.readFileSync(paymentProofPath);
        base64Content = fileContent.toString('base64');
      }

      if (base64Content) {
        attachments.push({
          content: base64Content,
          filename: fileName
        });
        console.log(`📎 Attaching payment proof: ${fileName}`);
      }
    } catch (err) {
      console.error('❌ Failed to read or download payment proof file:', err.message);
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

  try {
    const data = await sendEmail({
      to: adminEmail,
      subject: `💰 UPI Payment - ${order.order_number} - ₹${totalAmount.toFixed(2)} [VERIFY]`,
      htmlContent: emailHtml,
      textContent: emailText,
      attachments
    });

    console.log('✅ ==========================================');
    console.log('✅ UPI EMAIL SENT SUCCESSFULLY!');
    console.log('✅ ==========================================');
    console.log(`   Message ID: ${data.messageId}`);
    console.log(`   To: ${adminEmail}`);
    console.log('✅ ==========================================\n');
    
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.warn('\n⚠️  Failed to send UPI payment email:', error.message);
    console.warn('⚠️  Order was processed successfully despite email error.\n');
    return { success: false, error: error.message, skipped: true };
  }
}

module.exports = {
  sendEmail,
  sendOrderNotificationEmail,
  sendUPIPaymentEmail,
  sendCustomerOrderConfirmationEmail,
};
