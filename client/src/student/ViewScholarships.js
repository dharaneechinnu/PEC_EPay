import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Card = ({ s }) => {
  const navigate = useNavigate();
  const deadline = s.applicationDeadline
    ? new Date(s.applicationDeadline).toLocaleDateString()
    : 'N/A';

  return (
    <div className="scholarship-card">
      <h3>{s.scholarshipName}</h3>
      <div className="provider">{s.providerName}</div>
      <p>{s.description}</p>
      <div className="card-footer">
        <div className="card-info">
          <div><strong>Amount:</strong> ₹{s.scholarshipAmount}</div>
          <div><strong>Deadline:</strong> {deadline}</div>
        </div>
      </div>
    </div>
  );
};

const ViewScholarships = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:3500/student/scholarships');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch');
        setScholarships(data.scholarships || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <style>
        {`
          .view-scholarships-page {
            min-height: 100vh;
            padding: 40px;
            background: #ffffffff;
            color: #1e3a8a;
            font-family: 'Poppins', sans-serif;
          }

          .scholarships-container {
            max-width: 1100px;
            margin: 0 auto;
          }

          .scholarships-title {
            margin-bottom: 24px;
            font-size: 2rem;
            font-weight: 700;
            text-align: center;
            color: #00a2ff;
          }

          .scholarships-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }

          .scholarship-card {
            background: #ffffff;
            border: 2px solid #bde0ff;
            border-radius: 12px;
            padding: 20px 22px;
            box-shadow: 0 6px 12px rgba(0, 162, 255, 0.08);
            transition: all 0.25s ease;
            cursor: pointer;
          }

          .scholarship-card:hover {
            background: #eaf6ff;
            transform: translateY(-5px);
            box-shadow: 0 10px 18px rgba(0, 162, 255, 0.15);
          }

          .scholarship-card h3 {
            margin: 0;
            color: #00a2ff;
            font-size: 1.4rem;
            font-weight: 700;
          }

          .provider {
            color: #007bff;
            font-size: 0.95rem;
            margin-top: 6px;
            font-weight: 500;
          }

          .scholarship-card p {
            color: #1e3a8a;
            margin-top: 12px;
            line-height: 1.5;
            max-height: 6em;
            overflow: hidden;
            font-size: 0.95rem;
          }

          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 16px;
          }

          .card-info {
            color: #004c99;
            font-size: 0.9rem;
            line-height: 1.4;
          }

          .loading-text,
          .error-text,
          .no-data-text {
            text-align: center;
            margin-top: 50px;
            font-size: 1rem;
            font-weight: 500;
          }

          .loading-text {
            color: #007bff;
          }

          .error-text {
            color: #ff4d4f;
          }

          .no-data-text {
            color: #007bff;
          }
        `}
      </style>

      <div className="view-scholarships-page">
        <div className="scholarships-container">
          <h2 className="scholarships-title">Available Scholarships</h2>

          {loading ? (
            <div className="loading-text">Loading scholarships...</div>
          ) : error ? (
            <div className="error-text">{error}</div>
          ) : scholarships.length === 0 ? (
            <div className="no-data-text">No scholarships available right now.</div>
          ) : (
            <div className="scholarships-grid">
              {scholarships.map((s) => (
                <Card key={s._id} s={s} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ViewScholarships;
