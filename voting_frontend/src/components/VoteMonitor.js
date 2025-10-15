import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

function VoteMonitor() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await axios.get(`${API_BASE}/admin/vote-logs`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setLogs(res.data);
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h3>Live Vote Monitor</h3>
      <ul>
        {logs.map((log, i) => (
          <li key={i}>
            Voter ID: {log.voter_id} → Candidate #{log.candidate_id} at {log.timestamp}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VoteMonitor;