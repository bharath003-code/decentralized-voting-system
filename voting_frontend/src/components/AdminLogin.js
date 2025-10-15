import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import { useNavigate } from 'react-router-dom';

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const login = async () => {
  try {
    const res = await axios.post(`${API_BASE}/admin/login`, {
      email,
      password
    });

    if (res.data.success) {
      localStorage.setItem('adminToken', res.data.token);
      navigate('/admin/dashboard');
    } else {
      setError('Invalid credentials');
    }
  } catch (err) {
    setError('Server error');
   }
  };

  return (
    <div>
      <h2>Admin Login</h2>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <button onClick={login}>Login</button>
    </div>
  );
}

export default AdminLogin;

