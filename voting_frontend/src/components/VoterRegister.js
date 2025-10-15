import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

function VoterRegister() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wallet, setWallet] = useState('');
  const [message, setMessage] = useState('');

  const register = async () => {
    const res = await axios.post(`${API_BASE}/voter/register`, { name, phone, wallet });
    setMessage(res.data.message || res.data.error);
  };

  return (
    <div>
      <h2>Voter Registration</h2>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" />
      <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone Number" />
      <input value={wallet} onChange={e => setWallet(e.target.value)} placeholder="Wallet Address" />
      <button onClick={register}>Register</button>
      <p>{message}</p>
    </div>
  );
}

export default VoterRegister;