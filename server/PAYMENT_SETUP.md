# Payment Integration Setup Guide

Your e-commerce site uses **Cashfree Payments** for processing online payments. This guide will help you set it up.

## Current Payment Methods Supported

1. **Credit/Debit Card** - Visa, Mastercard, RuPay
2. **UPI** - PhonePe, Google Pay, Paytm, and other UPI apps
3. **Digital Wallet** - Paytm, Amazon Pay, Freecharge
4. **Cash on Delivery (COD)** - Pay when you receive

## Step 1: Create Cashfree Account

1. Go to https://www.cashfree.com/
2. Click "Sign Up" and create an account
3. Complete business verification (required for production)

## Step 2: Get Your API Credentials

### For Testing (Sandbox Mode)

1. Log in to Cashfree Dashboard
2. Go to **Developers** → **API Keys**
3. You'll see:
   - **App ID** (Client ID)
   - **Secret Key**
4. Copy both values

### For Production

1. Complete business verification
2. Switch to **Production** mode in dashboard
3. Get your production **App ID** and **Secret Key**

## Step 3: Add Credentials to .env File

Open `server/.env` and add:

```env
# Cashfree Payment Gateway
CASHFREE_APP_ID=your_app_id_here
CASHFREE_SECRET_KEY=your_secret_key_here
```

**Important:**
- For testing, use **Sandbox** credentials
- For production, use **Production** credentials
- Never commit these credentials to Git!

## Step 4: Update API URL (Production Only)

When moving to production, update `server/routes/payments.js`:

**Change line 37 from:**
```javascript
const cfResponse = await fetch('https://sandbox.cashfree.com/pg/orders', {
```

**To:**
```javascript
const cfResponse = await fetch('https://api.cashfree.com/pg/orders', {
```

## Step 5: Configure Webhook (Production)

1. In Cashfree Dashboard, go to **Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Select events: `PAYMENT_SUCCESS`, `PAYMENT_FAILED`

## How It Works

1. **Customer places order** → Order created in database
2. **Payment method selected**:
   - **COD**: Order confirmed immediately
   - **Online**: Cashfree payment link generated
3. **Customer redirected** to Cashfree payment page
4. **Customer pays** using their preferred method
5. **Cashfree redirects back** to your site
6. **Webhook updates** order status automatically
7. **Email notification** sent to admin

## Testing Payments

### Test Cards (Sandbox Mode)

Use these test card numbers:
- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Test UPI IDs

- Use any UPI ID in sandbox mode
- Payments will be simulated

## Troubleshooting

### Payment Link Not Generated
- Check `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY` in `.env`
- Verify credentials are correct
- Check server logs for error messages

### Payment Not Updating Status
- Verify webhook URL is accessible
- Check webhook configuration in Cashfree dashboard
- Review server logs for webhook errors

### Common Errors

**"Invalid credentials"**
- Verify App ID and Secret Key are correct
- Make sure you're using the right environment (sandbox vs production)

**"Order not found"**
- Check if order was created successfully
- Verify order number matches

## Production Checklist

- [ ] Business verification completed
- [ ] Production API credentials obtained
- [ ] API URL updated to production
- [ ] Webhook URL configured
- [ ] SSL certificate installed (HTTPS required)
- [ ] Test payments completed successfully
- [ ] Email notifications working

## Support

- Cashfree Docs: https://docs.cashfree.com/
- Cashfree Support: support@cashfree.com

