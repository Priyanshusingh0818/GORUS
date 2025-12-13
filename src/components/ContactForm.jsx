import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { sendEmail } from '../utils/emailService';

const ContactForm = ({ onClose }) => {
	const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

	// Handle ESC key to close modal
	useEffect(() => {
		const handleEscape = (e) => {
			if (e.key === 'Escape' && onClose) {
				onClose();
			}
		};

		document.addEventListener('keydown', handleEscape);
		// Prevent body scroll when modal is open
		document.body.style.overflow = 'hidden';

		return () => {
			document.removeEventListener('keydown', handleEscape);
			document.body.style.overflow = 'unset';
		};
	}, [onClose]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		try {
			await sendEmail(formData);
			alert('Thank you for contacting us! We will get back to you soon.');
			if (onClose) onClose();
		} catch (err) {
			alert('Something went wrong. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleOverlayClick = (e) => {
		if (e.target === e.currentTarget && onClose) {
			onClose();
		}
	};

	return (
		<div className="modal-overlay" onClick={handleOverlayClick}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<div style={styles.header}>
					<h2 style={styles.title}>Contact Us</h2>
					<button style={styles.closeBtn} onClick={onClose} aria-label="Close">
						<X size={20} />
					</button>
				</div>

				<p style={styles.subtitle}>Have questions? Send us a message and we'll respond as soon as possible.</p>

				<form onSubmit={handleSubmit} style={styles.form}>
					<div style={styles.formGroup}>
						<label style={styles.label}>Name *</label>
						<input name="name" value={formData.name} onChange={handleChange} required style={styles.input} placeholder="Your full name" />
					</div>

					<div style={styles.formGroup}>
						<label style={styles.label}>Email *</label>
						<input name="email" type="email" value={formData.email} onChange={handleChange} required style={styles.input} placeholder="your.email@example.com" />
					</div>

					<div style={styles.formGroup}>
						<label style={styles.label}>Phone *</label>
						<input name="phone" value={formData.phone} onChange={handleChange} required style={styles.input} placeholder="+91 98765 43210" />
					</div>

					<div style={styles.formGroup}>
						<label style={styles.label}>Message *</label>
						<textarea name="message" value={formData.message} onChange={handleChange} required rows={5} style={styles.textarea} placeholder="Tell us about your query..." />
					</div>

					<button type="submit" className="btn-primary" style={styles.submitBtn} disabled={isSubmitting}>
						<Send size={16} />
						{isSubmitting ? 'Sending...' : 'Send Message'}
					</button>
				</form>
			</div>
		</div>
	);
};

const styles = {
	header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
	title: { fontSize: 20, fontWeight: 700, color: '#111827' },
	closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6b7280' },
	subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
	form: { display: 'flex', flexDirection: 'column', gap: 16 },
	formGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
	label: { fontSize: 14, fontWeight: 600, color: '#374151' },
	input: { padding: 12, border: '2px solid #e5e7eb', borderRadius: 8 },
	textarea: { padding: 12, border: '2px solid #e5e7eb', borderRadius: 8, fontFamily: 'Poppins, sans-serif' },
	submitBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }
};

export default ContactForm;

