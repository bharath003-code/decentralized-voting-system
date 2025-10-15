import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

function Results() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/results`).then(res => setResults(res.data));
  }, []);

  return (
    <div>
      <h2>Election Results</h2>
      <ul>
        {results.map((r, i) => (
          <li key={i}>{r.name}: {r.votes} votes</li>
        ))}
      </ul>
    </div>
  );
}

export default Results;