import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

function Vote() {
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(null);
  const voterId = localStorage.getItem('voterId');

  useEffect(() => {
    axios.get(`${API_BASE}/candidates`).then(res => setCandidates(res.data));
  }, []);

  const castVote = async () => {
    const res = await axios.post(`${API_BASE}/vote`, {
      voterId,
      candidateId: selected
    });
    alert(res.data.message || res.data.error);
  };

  return (
    <div>
      <h2>Cast Your Vote</h2>
      {candidates.map(c => (
        <div key={c.id}>
          <input type="radio" name="candidate" value={c.id} onChange={() => setSelected(c.id)} />
          {c.name}
        </div>
      ))}
      <button onClick={castVote}>Vote</button>
    </div>
  );
}

export default Vote;