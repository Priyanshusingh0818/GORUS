import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Building2, CheckCircle, Clock, Upload, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../utils/api';

const Checkout = () => {
	const { cartItems, getCartTotal, clearCart } = useCart();
	const { user } = useAuth();
	const navigate = useNavigate();
	const [shipping, setShipping] = useState({ name: user?.name || '', address: '', phone: '' });
	const [paymentMethod, setPaymentMethod] = useState('upi');
	const [isPlacing, setIsPlacing] = useState(false);
	const [error, setError] = useState('');
	const [showQRCode, setShowQRCode] = useState(false);
	const [orderId, setOrderId] = useState(null);
	const [orderNumber, setOrderNumber] = useState(null);
	
	// Screenshot upload states
	const [screenshot, setScreenshot] = useState(null);
	const [screenshotPreview, setScreenshotPreview] = useState(null);
	const [isUploading, setIsUploading] = useState(false);

	const handleChange = (e) => setShipping({ ...shipping, [e.target.name]: e.target.value });

	const handlePlaceOrder = async (e) => {
		e.preventDefault();
		setError('');
		
		if (!user) {
			navigate('/login');
			return;
		}

		if (cartItems.length === 0) {
			setError('Your cart is empty');
			return;
		}

		setIsPlacing(true);
		try {
			const orderData = {
				items: cartItems.map(item => ({
					id: item.id,
					name: item.name,
					price: item.price,
					quantity: item.quantity
				})),
				shipping,
				paymentMethod,
				totalAmount: getCartTotal()
			};

			const orderResponse = await ordersAPI.create(orderData);
			const createdOrderId = orderResponse.order.id;
			const createdOrderNumber = orderResponse.order.order_number;

			setOrderId(createdOrderId);
			setOrderNumber(createdOrderNumber);

			if (paymentMethod === 'cod') {
				clearCart();
				navigate('/order-confirmation', { state: { orderId: createdOrderId, paymentMethod } });
			} else {
				setShowQRCode(true);
			}
		} catch (err) {
			if (err.message === 'SESSION_EXPIRED') {
				setError('Your session has expired. Please login again.');
				setTimeout(() => {
					navigate('/login');
				}, 2000);
			} else {
				setError(err.message || 'Failed to place order. Please try again.');
			}
		} finally {
			setIsPlacing(false);
		}
	};

	const handleScreenshotChange = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please upload only image files (PNG, JPG, etc.)');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			alert('File size should be less than 5MB');
			return;
		}

		setScreenshot(file);
		const reader = new FileReader();
		reader.onloadend = () => {
			setScreenshotPreview(reader.result);
		};
		reader.readAsDataURL(file);
	};

	const removeScreenshot = () => {
		setScreenshot(null);
		setScreenshotPreview(null);
	};

	const handlePaymentComplete = async () => {
		if (!screenshot) {
			alert('Please upload payment screenshot before confirming');
			return;
		}

		setIsUploading(true);
		setError('');

		try {
			// Get token from localStorage using the correct key
			const token = localStorage.getItem('gorasToken');
			
			console.log('Token check:', token ? 'Token exists' : 'No token');
			console.log('Order ID:', orderId);
			console.log('User:', user);
			
			if (!token) {
				setError('Session expired. Please login again.');
				setTimeout(() => navigate('/login'), 2000);
				return;
			}

			const formData = new FormData();
			formData.append('paymentProof', screenshot);
			formData.append('orderId', orderId);
			formData.append('orderNumber', orderNumber);
			formData.append('totalAmount', getCartTotal());
			formData.append('customerName', shipping.name);
			formData.append('customerEmail', user.email);
			formData.append('customerPhone', shipping.phone);

			console.log('Sending payment confirmation...');

			const response = await fetch('/api/payments/confirm-upi', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`
				},
				body: formData
			});

			console.log('Response status:', response.status);

			const data = await response.json();
			console.log('Response data:', data);

			if (response.ok) {
				clearCart();
				navigate('/order-confirmation', { state: { orderId, paymentMethod: 'upi' } });
			} else {
				if (response.status === 401) {
					setError('Session expired. Please login again.');
					setTimeout(() => navigate('/login'), 2000);
				} else {
					setError(data.message || 'Failed to confirm payment');
				}
			}
		} catch (err) {
			console.error('Error confirming payment:', err);
			setError('Failed to confirm payment. Please try again.');
		} finally {
			setIsUploading(false);
		}
	};

	const total = getCartTotal();

	if (!user) {
		return (
			<div style={styles.page}>
				<div className="container">
					<div className="card" style={styles.authRequired}>
						<h2 style={styles.authTitle}>Please Login</h2>
						<p style={styles.authText}>You need to be logged in to checkout.</p>
						<button className="btn-primary" onClick={() => navigate('/login')}>
							Go to Login
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (showQRCode) {
		return (
			<div style={styles.page}>
				<div className="container">
					<div style={styles.qrContainer}>
						<div className="card" style={styles.qrCard}>
							<div style={styles.qrHeader}>
								<Clock size={48} style={{ color: '#22c55e' }} />
								<h2 style={styles.qrTitle}>Complete Your Payment</h2>
								<p style={styles.qrSubtitle}>Order #{orderNumber}</p>
							</div>

							<div style={styles.qrCodeBox}>
								<img 
									src="/images/upi-qr-code.png" 
									alt="UPI QR Code" 
									style={styles.qrImage}
									onError={(e) => {
										e.target.style.display = 'none';
										e.target.nextSibling.style.display = 'block';
									}}
								/>
								<div style={{ ...styles.qrPlaceholder, display: 'none' }}>
									<Smartphone size={64} style={{ color: '#22c55e' }} />
									<p style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>
										QR Code will appear here
									</p>
								</div>
							</div>

							<div style={styles.paymentAmount}>
								<span style={styles.amountLabel}>Amount to Pay:</span>
								<span style={styles.amountValue}>₹{total.toFixed(2)}</span>
							</div>

							<div style={styles.qrInstructions}>
								<h3 style={styles.instructionTitle}>How to Pay:</h3>
								<ol style={styles.instructionList}>
									<li>Open your UPI app (PhonePe, Google Pay, Paytm, etc.)</li>
									<li>Scan the QR code above</li>
									<li>Verify the amount: ₹{total.toFixed(2)}</li>
									<li>Complete the payment</li>
									<li><strong>Take a screenshot of payment confirmation</strong></li>
									<li>Upload the screenshot below</li>
								</ol>
							</div>

							{/* Screenshot Upload Section */}
							<div style={styles.uploadSection}>
								<h3 style={styles.uploadTitle}>
									<Upload size={20} />
									Upload Payment Screenshot
								</h3>
								
								{!screenshotPreview ? (
									<label style={styles.uploadBox}>
										<input 
											type="file" 
											accept="image/*" 
											onChange={handleScreenshotChange}
											style={{ display: 'none' }}
										/>
										<Upload size={32} style={{ color: '#22c55e', marginBottom: 8 }} />
										<p style={styles.uploadText}>Click to upload screenshot</p>
										<p style={styles.uploadSubtext}>PNG, JPG up to 5MB</p>
									</label>
								) : (
									<div style={styles.previewBox}>
										<img 
											src={screenshotPreview} 
											alt="Payment screenshot" 
											style={styles.previewImage}
										/>
										<button 
											onClick={removeScreenshot}
											style={styles.removeButton}
											type="button"
										>
											<X size={16} />
										</button>
									</div>
								)}
							</div>

							{error && (
								<div style={styles.errorBox}>
									❌ {error}
									{error.includes('Session expired') && (
										<div style={{ marginTop: 8, fontSize: 12 }}>
											Redirecting to login...
										</div>
									)}
								</div>
							)}

							<div style={styles.qrActions}>
								<button 
									className="btn-primary" 
									style={styles.confirmButton}
									onClick={handlePaymentComplete}
									disabled={!screenshot || isUploading}
								>
									<CheckCircle size={20} />
									{isUploading ? 'Processing...' : 'Confirm Payment'}
								</button>
								<button 
									className="btn-secondary" 
									style={styles.cancelButton}
									onClick={() => {
										setShowQRCode(false);
										setOrderId(null);
										setOrderNumber(null);
										setScreenshot(null);
										setScreenshotPreview(null);
									}}
									disabled={isUploading}
								>
									Cancel & Go Back
								</button>
							</div>

							<p style={styles.qrNote}>
								⚠️ Don't close this page until you upload the payment screenshot
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={styles.page}>
			<div className="container">
				<h1 style={styles.title}>Checkout</h1>

				<div style={styles.grid}>
					<form className="card" style={styles.form} onSubmit={handlePlaceOrder}>
						<h2 style={styles.sectionTitle}>Shipping Details</h2>
						
						{error && (
							<div style={styles.error}>
								{error}
								{error.includes('session') && (
									<div style={styles.errorNote}>Redirecting to login...</div>
								)}
							</div>
						)}

						<label style={styles.label}>Full Name</label>
						<input name="name" value={shipping.name} onChange={handleChange} required style={styles.input} />

						<label style={styles.label}>Address</label>
						<textarea name="address" value={shipping.address} onChange={handleChange} required rows={4} style={styles.input} />

						<label style={styles.label}>Phone</label>
						<input name="phone" value={shipping.phone} onChange={handleChange} required style={styles.input} />

						<div style={styles.divider} />

						<h2 style={styles.sectionTitle}>Payment Method</h2>
						
						<div style={styles.paymentMethods}>
							<label style={styles.paymentOption}>
								<input
									type="radio"
									name="paymentMethod"
									value="upi"
									checked={paymentMethod === 'upi'}
									onChange={(e) => setPaymentMethod(e.target.value)}
									style={styles.radio}
								/>
								<div style={getPaymentCardStyle(paymentMethod === 'upi')}>
									<Smartphone size={24} style={styles.paymentIcon} />
									<div>
										<div style={styles.paymentTitle}>UPI Payment</div>
										<div style={styles.paymentDesc}>Scan QR & Pay Instantly</div>
									</div>
								</div>
							</label>

							<label style={styles.paymentOption}>
								<input
									type="radio"
									name="paymentMethod"
									value="cod"
									checked={paymentMethod === 'cod'}
									onChange={(e) => setPaymentMethod(e.target.value)}
									style={styles.radio}
								/>
								<div style={getPaymentCardStyle(paymentMethod === 'cod')}>
									<Building2 size={24} style={styles.paymentIcon} />
									<div>
										<div style={styles.paymentTitle}>Cash on Delivery</div>
										<div style={styles.paymentDesc}>Pay when you receive</div>
									</div>
								</div>
							</label>
						</div>

						<button type="submit" className="btn-primary" style={{ marginTop: 16 }} disabled={isPlacing}>
							{isPlacing ? 'Processing...' : (paymentMethod === 'upi' ? 'Proceed to Pay' : 'Place Order')}
						</button>
					</form>

					<div>
						<div className="card" style={styles.summary}>
							<h2 style={styles.sectionTitle}>Order Summary</h2>
							<div style={styles.summaryList}>
								{cartItems.map(item => (
									<div key={item.id} style={styles.summaryRow}>
										<div>
											<strong>{item.name}</strong>
											<div style={{ color: '#6b7280' }}>{item.quantity} × ₹{item.price}</div>
										</div>
										<div>₹{(item.price * item.quantity).toFixed(2)}</div>
									</div>
								))}
							</div>

							<div style={styles.divider} />
							<div style={styles.summaryRow}>
								<strong>Total</strong>
								<strong style={{ color: '#22c55e' }}>₹{total.toFixed(2)}</strong>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

const styles = {
	page: { minHeight: '100vh', padding: '40px 0 80px', backgroundColor: '#f0fdf4' },
	title: { fontSize: 36, fontWeight: 700, color: '#111827', marginBottom: 20 },
	grid: { display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' },
	form: { padding: 20, display: 'flex', flexDirection: 'column', gap: 12 },
	sectionTitle: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
	label: { fontSize: 14, fontWeight: 600, color: '#374151', marginTop: 8 },
	input: { padding: 12, borderRadius: 8, border: '2px solid #e5e7eb', fontSize: 14 },
	summary: { padding: 20 },
	summaryList: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 },
	summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
	divider: { height: 1, backgroundColor: '#e5e7eb', margin: '12px 0' },
	error: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 12 },
	errorNote: { fontSize: 12, marginTop: 8, opacity: 0.8 },
	authRequired: { maxWidth: 500, margin: '100px auto', padding: 40, textAlign: 'center' },
	authTitle: { fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#111827' },
	authText: { fontSize: 16, color: '#6b7280', marginBottom: 24 },
	paymentMethods: { display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 },
	paymentOption: { cursor: 'pointer' },
	radio: { display: 'none' },
	paymentIcon: { color: '#22c55e', flexShrink: 0 },
	paymentTitle: { fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 },
	paymentDesc: { fontSize: 12, color: '#6b7280' },
	qrContainer: { maxWidth: 600, margin: '0 auto' },
	qrCard: { padding: 40, textAlign: 'center' },
	qrHeader: { marginBottom: 32 },
	qrTitle: { fontSize: 28, fontWeight: 700, color: '#111827', marginTop: 16, marginBottom: 8 },
	qrSubtitle: { fontSize: 14, color: '#6b7280' },
	qrCodeBox: { 
		backgroundColor: '#f9fafb', 
		padding: 32, 
		borderRadius: 12, 
		marginBottom: 24,
		border: '2px dashed #e5e7eb'
	},
	qrImage: { 
		width: '100%', 
		maxWidth: 300, 
		height: 'auto',
		margin: '0 auto',
		display: 'block'
	},
	qrPlaceholder: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 300
	},
	paymentAmount: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		gap: 12,
		padding: 16,
		backgroundColor: '#f0fdf4',
		borderRadius: 8,
		marginBottom: 24
	},
	amountLabel: { fontSize: 16, color: '#6b7280' },
	amountValue: { fontSize: 32, fontWeight: 700, color: '#22c55e' },
	qrInstructions: { 
		textAlign: 'left', 
		backgroundColor: '#f9fafb', 
		padding: 20, 
		borderRadius: 8,
		marginBottom: 24
	},
	instructionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#111827' },
	instructionList: { 
		margin: 0, 
		paddingLeft: 20, 
		color: '#6b7280',
		display: 'flex',
		flexDirection: 'column',
		gap: 8
	},
	uploadSection: {
		backgroundColor: '#fff',
		border: '2px solid #e5e7eb',
		borderRadius: 12,
		padding: 20,
		marginBottom: 20
	},
	uploadTitle: {
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		fontSize: 16,
		fontWeight: 600,
		color: '#111827',
		marginBottom: 16
	},
	uploadBox: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 32,
		border: '2px dashed #22c55e',
		borderRadius: 8,
		backgroundColor: '#f0fdf4',
		cursor: 'pointer',
		transition: 'all 0.2s'
	},
	uploadText: {
		fontSize: 14,
		fontWeight: 500,
		color: '#374151',
		marginBottom: 4
	},
	uploadSubtext: {
		fontSize: 12,
		color: '#6b7280'
	},
	previewBox: {
		position: 'relative',
		display: 'inline-block',
		width: '100%'
	},
	previewImage: {
		width: '100%',
		maxHeight: 300,
		objectFit: 'contain',
		borderRadius: 8,
		border: '2px solid #22c55e'
	},
	removeButton: {
		position: 'absolute',
		top: 8,
		right: 8,
		backgroundColor: '#ef4444',
		color: 'white',
		border: 'none',
		borderRadius: '50%',
		width: 32,
		height: 32,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		cursor: 'pointer',
		boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
	},
	errorBox: {
		backgroundColor: '#fee2e2',
		color: '#b91c1c',
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
		textAlign: 'center'
	},
	qrActions: {
		display: 'flex',
		flexDirection: 'column',
		gap: 12,
		marginBottom: 16
	},
	confirmButton: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		padding: '14px 24px',
		fontSize: 16,
		fontWeight: 600
	},
	cancelButton: {
		padding: '12px 24px',
		fontSize: 14,
		backgroundColor: 'white',
		color: '#6b7280',
		border: '2px solid #e5e7eb',
		borderRadius: 8,
		cursor: 'pointer',
		fontWeight: 500,
		transition: 'all 0.2s'
	},
	qrNote: {
		fontSize: 12,
		color: '#ef4444',
		fontStyle: 'italic',
		marginTop: 8
	}
};

const getPaymentCardStyle = (isSelected) => ({
	display: 'flex',
	alignItems: 'center',
	gap: 12,
	padding: 16,
	border: `2px solid ${isSelected ? '#22c55e' : '#e5e7eb'}`,
	borderRadius: 8,
	transition: 'all 0.2s',
	cursor: 'pointer',
	backgroundColor: isSelected ? '#f0fdf4' : 'white'
});

export default Checkout;