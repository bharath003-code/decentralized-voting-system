import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';

function VoterLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captchaHash, setCaptchaHash] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const sendOtp = async () => {
    const res = await axios.post(`${API_BASE}/send-otp`, {
      phone,
      captcha_text: captchaText,
      captcha_hash: captchaHash
    });
    if (res.data.success) setStep(2);
    else alert(res.data.error);
  };

  const verifyOtp = async () => {
    const res = await axios.post(`${API_BASE}/verify-otp`, { phone, otp });
    if (res.data.success) {
      localStorage.setItem('voterId', res.data.user.id);
      navigate('/vote');
    } else {
      alert(res.data.message);
    }
  };

  return (
    <div>
      <h2>Voter Login</h2>
      {step === 1 ? (
        <>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone" />
          <input value={captchaText} onChange={e => setCaptchaText(e.target.value)} placeholder="CAPTCHA Text" />
          <input value={captchaHash} onChange={e => setCaptchaHash(e.target.value)} placeholder="CAPTCHA Hash" />
          <button onClick={sendOtp}>Send OTP</button>
          const [captcha, setCaptcha] = useState('');
        </>
      ) : (
        <>
          <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter OTP" />
          <button onClick={verifyOtp}>Verify OTP</button>
        </>
      )}
    </div>
  );
}

export default VoterLogin;