import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import VoterLogin from './components/VoterLogin';
import VoterRegister from './components/VoterRegister';
import Vote from './components/Vote';
import Results from './components/Results';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminLogin />} /> 
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/voter-login" element={<VoterLogin />} />
        <Route path="/register" element={<VoterRegister />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Router>
  );
}

export default App;


