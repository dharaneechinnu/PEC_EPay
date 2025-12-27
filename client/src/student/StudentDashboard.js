import React from 'react';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  return (
    <>
      <style>
        {`
          body {
            margin: 0;
            font-family: 'Poppins', sans-serif;
            background: #f4faff;
            color: #1e3a8a;
          }

          .patient-dashboard {
            min-height: 100vh;
            padding: 40px;
          }

          .dashboard-container {
            max-width: 1000px;
            margin: 0 auto;
            background: #ffffff;
            border: 2px solid #dceeff;
            border-radius: 16px;
            padding: 40px 50px;
            box-shadow: 0 8px 20px rgba(0, 162, 255, 0.08);
          }

          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e8f4ff;
            padding-bottom: 15px;
          }

          header h1 {
            margin: 0;
            font-size: 2rem;
            color: #00a2ff;
            font-weight: 700;
          }

          .logout-btn {
            padding: 8px 14px;
            border-radius: 8px;
            border: 2px solid #00a2ff;
            background: #00a2ff;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
          }

          .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 22px;
          }

          .dashboard-card {
            background: #ffffff;
            border: 2px solid #bde0ff;
            border-radius: 12px;
            padding: 20px 24px;
            box-shadow: 0 4px 10px rgba(0, 162, 255, 0.08);
            transition: 0.25s ease;
          }

          .dashboard-card:hover {
            transform: translateY(-4px);
          }

          .dashboard-card h3 {
            margin-top: 0;
            color: #00a2ff;
            font-size: 1.3rem;
          }

          .view-btn {
            margin-top: 12px;
            padding: 10px 16px;
            border-radius: 8px;
            border: 2px solid #00a2ff;
            background: #00a2ff;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
          }

          .input-box {
            width: 100%;
            padding: 10px;
            border-radius: 8px;
            border: 2px solid #bde0ff;
            margin-bottom: 10px;
          }

          .result-box {
            margin-top: 12px;
            padding: 12px;
            border-radius: 8px;
            background: #f4faff;
            border: 1.5px solid #bde0ff;
          }

          .error-text {
            color: #ff4d4f;
          }

          .success-text {
            color: #0056b3;
          }
        `}
      </style>

      <div className="patient-dashboard">
        <div className="dashboard-container">
          <header>
            <h1>Patient Dashboard</h1>
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
              }}
            >
              {token ? 'Logout' : 'Login'}
            </button>
          </header>

          <div className="dashboard-grid">
            {/* Emergency Credit Card */}
            <div className="dashboard-card">
              <h3>Emergency Credit Status</h3>
              <p>Check the status of your emergency hospital credit.</p>
              <EmergencyCreditChecker />
            </div>

            {/* EMI Card */}
            <div className="dashboard-card">
              <h3>EMI & Repayment</h3>
              <p>View your EMI schedule and make repayments.</p>
              <button
                className="view-btn"
                onClick={() => navigate('/patient/repayment')}
              >
                View EMI Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const EmergencyCreditChecker = () => {
  const [requestId, setRequestId] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const checkStatus = async () => {
    if (!requestId) {
      setResult({ error: 'Please enter Request ID' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // MOCK API – replace later
      const res = await fetch(
        `http://localhost:3500/patient/credit-status/${encodeURIComponent(requestId)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data.message || 'Unable to fetch status' });
      } else {
        setResult({ success: data });
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <input
        className="input-box"
        placeholder="Credit Request ID (e.g. CR-1023)"
        value={requestId}
        onChange={(e) => setRequestId(e.target.value)}
      />

      <button className="view-btn" onClick={checkStatus}>
        {loading ? 'Checking...' : 'Check Status'}
      </button>

      {result && (
        <div className="result-box">
          {result.error ? (
            <div className="error-text">{result.error}</div>
          ) : (
            <div className="success-text">
              <div><strong>Status:</strong> {result.success.status}</div>
              <div><strong>Amount Approved:</strong> ₹{result.success.amount}</div>
              <div><strong>Hospital:</strong> {result.success.hospital}</div>
              <div><strong>Repayment:</strong> {result.success.repaymentType}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default PatientDashboard;
