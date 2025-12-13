import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [phone, setPhone] = useState('');
	const [error, setError] = useState('');
	const { signup } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		
		if (!name || !email || !password) {
			setError('Please fill in all required fields');
			return;
		}

		try {
			const res = await signup(name, email, password);
			if (res.success) {
				navigate('/');
			} else {
				// Show user-friendly error messages
				const errorMsg = res.error || 'Signup failed';
				if (errorMsg === 'SESSION_EXPIRED') {
					setError('Signup failed. Please try again.');
				} else {
					setError(errorMsg);
				}
			}
		} catch (error) {
			console.error('Signup error:', error);
			const errorMessage = error.message || 'An error occurred';
			if (errorMessage === 'SESSION_EXPIRED') {
				setError('Signup failed. Please try again.');
			} else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
				setError('Cannot connect to server. Please make sure the backend is running on port 5000.');
			} else {
				setError(errorMessage);
			}
		}
	};

	return (
		<div style={styles.page}>
			<div className="container">
				<div style={styles.card} className="card">
					<h1 style={styles.title}>Sign Up</h1>

					{error && <div style={styles.error}>{error}</div>}

					<form onSubmit={handleSubmit} style={styles.form}>
						<label style={styles.label}>Full Name</label>
						<input value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} />

						<label style={styles.label}>Email</label>
						<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />

						<label style={styles.label}>Phone</label>
						<input value={phone} onChange={(e) => setPhone(e.target.value)} required style={styles.input} />

						<label style={styles.label}>Password</label>
						<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />

						<button type="submit" className="btn-primary" style={styles.button}>Create Account</button>
					</form>

					<p style={styles.footerText}>
						Already have an account? <Link to="/login">Log in</Link>
					</p>
				</div>
			</div>
		</div>
	);
};

const styles = {
	page: { minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '40px 0' },
	card: { maxWidth: 480, margin: '0 auto', padding: 24 },
	title: { fontSize: 28, fontWeight: 700, marginBottom: 12 },
	form: { display: 'flex', flexDirection: 'column', gap: 12 },
	label: { fontSize: 14, fontWeight: 600 },
	input: { padding: 12, borderRadius: 8, border: '2px solid #e5e7eb' },
	button: { marginTop: 8 },
	footerText: { marginTop: 12, color: '#6b7280' },
	error: { backgroundColor: '#fee2e2', color: '#b91c1c', padding: 8, borderRadius: 8, marginBottom: 8 }
};

export default Signup;
