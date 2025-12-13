import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		
		if (!email || !password) {
			setError('Please fill in all fields');
			return;
		}

		try {
			const res = await login(email, password);
			if (res.success) {
				navigate('/');
			} else {
				// Show user-friendly error messages
				const errorMsg = res.error || 'Login failed';
				if (errorMsg === 'SESSION_EXPIRED') {
					setError('Invalid email or password. Please try again.');
				} else {
					setError(errorMsg);
				}
			}
		} catch (error) {
			console.error('Login error:', error);
			const errorMsg = error.message || 'An error occurred. Please check if the server is running.';
			if (errorMsg === 'SESSION_EXPIRED') {
				setError('Invalid email or password. Please try again.');
			} else {
				setError(errorMsg);
			}
		}
	};

	return (
		<div style={styles.page}>
			<div className="container">
				<div style={styles.card} className="card">
					<h1 style={styles.title}>Login</h1>

					{error && <div style={styles.error}>{error}</div>}

					<form onSubmit={handleSubmit} style={styles.form}>
						<label style={styles.label}>Email</label>
						<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={styles.input} />

						<label style={styles.label}>Password</label>
						<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={styles.input} />

						<button type="submit" className="btn-primary" style={styles.button}>Login</button>
					</form>

					<p style={styles.footerText}>
						Don't have an account? <Link to="/signup">Sign up</Link>
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

export default Login;
