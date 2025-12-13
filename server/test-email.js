// Quick test script to verify email configuration
require('dotenv').config();
const { sendOrderNotificationEmail } = require('./utils/emailService');

console.log('🧪 Testing Email Configuration...\n');

// Check environment variables
console.log('Environment Variables:');
console.log('  GMAIL_USER:', process.env.GMAIL_USER || '❌ NOT SET');
console.log('  GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('  ADMIN_NOTIFICATION_EMAIL:', process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || '❌ NOT SET');
console.log('');

// Test email with sample data
const testOrderData = {
  order: {
    order_number: 'TEST-ORDER-001',
    total_amount: 2010.00,
    shipping_name: 'Test Customer',
    shipping_address: '123 Test Street, Test City',
    shipping_phone: '1234567890',
    payment_method: 'card',
    status: 'pending',
    created_at: new Date().toISOString()
  },
  customer: {
    name: 'Test Customer',
    email: 'test@example.com'
  },
  items: [
    {
      product_name: 'Pure Desi Ghee',
      quantity: 1,
      product_price: 1800,
      subtotal: 1800
    },
    {
      product_name: 'Sarso Tel (Mustard Oil)',
      quantity: 1,
      product_price: 210,
      subtotal: 210
    }
  ]
};

console.log('📧 Sending test email...\n');

sendOrderNotificationEmail(testOrderData)
  .then(result => {
    if (result.success) {
      console.log('\n✅ SUCCESS! Email sent successfully!');
      console.log('   Check your inbox at:', process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL);
      console.log('   Also check SPAM folder if not in inbox.\n');
      process.exit(0);
    } else {
      console.log('\n❌ FAILED to send email');
      console.log('   Error:', result.error);
      console.log('\nTroubleshooting:');
      console.log('   1. Verify GMAIL_USER and GMAIL_APP_PASSWORD in .env');
      console.log('   2. Make sure 2FA is enabled on Gmail account');
      console.log('   3. Verify App Password is correct (16 characters, no spaces)');
      console.log('   4. Check if "Less secure app access" is needed (usually not with App Password)\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  });

