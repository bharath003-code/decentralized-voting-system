import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
import VoteMonitor from './VoteMonitor';

function AdminDashboard() {
  const token = localStorage.getItem('adminToken');

  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);
  const [newVoter, setNewVoter] = useState({ name: '', phone: '', wallet: '' });

  const [name, setName] = useState('');
  const [party, setParty] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Image validation
  const isValidImageUrl = (url) => /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
  const validateImageExists = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  // Add candidate
  const handleAddCandidate = async () => {
    setError('');
    setSuccess('');

    if (!name || !party || !imageUrl) {
      setError('All fields are required');
      return;
    }

    if (!isValidImageUrl(imageUrl)) {
      setError('Invalid image format');
      return;
    }

    const imageExists = await validateImageExists(imageUrl);
    if (!imageExists) {
      setError('Image URL is unreachable or broken');
      return;
    }

    try {
      const res = await axios.post(`${API_BASE}/add_candidate`, {
        name,
        party,
        imageUrl
      });

      if (res.data.status === 'success') {
        setSuccess('Candidate added successfully');
        setName('');
        setParty('');
        setImageUrl('');
        fetchCandidates();
      } else {
        setError(res.data.message || 'Could not add candidate');
      }
    } catch (err) {
      setError('Server error: ' + err.message);
    }
  };

  // Register voter
  const registerVoter = async () => {
    setError('');
    try {
      await axios.post(`${API_BASE}/voter/register`, newVoter);
      setNewVoter({ name: '', phone: '', wallet: '' });
      fetchVoters();
    } catch (err) {
      console.error("Failed to register voter:", err);
      setError("Could not register voter");
    }
  };

  // Fetch candidates
  const fetchCandidates = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/get_candidates`);
      setCandidates(res.data);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setError("Could not load candidates");
    }
  }, []);

  // Fetch voters
  const fetchVoters = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/voters`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVoters(res.data);
    } catch (err) {
      console.error("Failed to fetch voters:", err);
      setError("Could not load voter data");
    }
  }, [token]);

  useEffect(() => {
    fetchCandidates();
    fetchVoters();
  }, [fetchCandidates, fetchVoters]);

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>🗳️ Admin Dashboard</h2>

      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}

      {/* Add Candidate */}
      <section style={styles.section}>
        <h3>Add Candidate</h3>
        <input
          style={styles.input}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Party"
          value={party}
          onChange={(e) => setParty(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <button style={styles.button} onClick={handleAddCandidate}>Add Candidate</button>
      </section>

      {/* Register Voter */}
      <section style={styles.section}>
        <h3>Register Voter</h3>
        <input
          style={styles.input}
          placeholder="Name"
          value={newVoter.name}
          onChange={(e) => setNewVoter({ ...newVoter, name: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Phone"
          value={newVoter.phone}
          onChange={(e) => setNewVoter({ ...newVoter, phone: e.target.value })}
        />
        <input
          style={styles.input}
          placeholder="Wallet Address"
          value={newVoter.wallet}
          onChange={(e) => setNewVoter({ ...newVoter, wallet: e.target.value })}
        />
        <button style={styles.button} onClick={registerVoter}>Register</button>
      </section>

      {/* Registered Voters */}
      <section style={styles.section}>
        <h3>Registered Voters</h3>
        <ul style={styles.list}>
          {voters.length === 0 ? (
            <p>No voters registered</p>
          ) : (
            voters.map(v => (
              <li key={v.wallet} style={styles.listItem}>
                {v.name} ({v.phone}) – {v.wallet}
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Candidates */}
      <section style={styles.section}>
        <h3>Candidates</h3>
        {candidates.length === 0 ? (
          <p>No candidates yet</p>
        ) : (
          candidates.map(c => (
            <div key={c.id} style={styles.card}>
              <img src={c.image} alt={c.name} width="100" />
              <h4>{c.name}</h4>
              <p>Party: {c.party}</p>
              <p>Votes: {c.votes}</p>
            </div>
          ))
        )}
      </section>

      {/* Live Vote Monitor */}
      <section style={styles.section}>
        <h3>Live Vote Monitor</h3>
        <VoteMonitor />
      </section>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: 'auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  },
  header: {
    textAlign: 'center',
    color: '#333'
  },
  section: {
    marginBottom: '30px',
    padding: '10px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    boxShadow: '0 0 5px rgba(0,0,0,0.1)'
  },
  input: {
    display: 'block',
    marginBottom: '10px',
    padding: '8px',
    width: '100%',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  list: {
    listStyleType: 'none',
    paddingLeft: '0'
  },
  listItem: {
    padding: '6px 0',
    borderBottom: '1px solid #eee'
  },
  card: {
    border: '1px solid #ccc',
    padding: '12px',
    marginBottom: '10px',
    borderRadius: '6px',
    backgroundColor: '#f0f8ff'
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: '20px'
  },
  success: {
    color: 'green',
    textAlign: 'center',
    marginBottom: '20px'
  }
};

export default AdminDashboard;