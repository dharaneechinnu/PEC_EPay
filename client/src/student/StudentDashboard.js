import React from 'react';
import { useNavigate } from 'react-router-dom';

const StudentDashboard = () => {
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

          .student-dashboard {
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
            letter-spacing: 0.5px;
          }

          .logout-btn {
            padding: 8px 14px;
            border-radius: 8px;
            border: 2px solid #00a2ff;
            background: #00a2ff;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            transition: 0.3s ease;
          }

          .logout-btn:hover {
            background: #008fe0;
            box-shadow: 0 0 10px rgba(0, 162, 255, 0.3);
          }

          .dashboard-section {
            margin-top: 30px;
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
            transition: all 0.25s ease;
          }

          .dashboard-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 6px 16px rgba(0, 162, 255, 0.15);
          }

          .dashboard-card h3 {
            margin-top: 0;
            font-size: 1.3rem;
            color: #00a2ff;
            font-weight: 700;
          }

          .dashboard-card p {
            color: #1e3a8a;
            line-height: 1.6;
            font-size: 0.95rem;
            margin-bottom: 10px;
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
            transition: 0.3s ease;
          }

          .view-btn:hover {
            background: #008fe0;
            box-shadow: 0 0 10px rgba(0, 162, 255, 0.25);
          }

          /* Application Checker Styles */
          .app-checker-input {
            width: 100%;
            padding: 10px 12px;
            border-radius: 8px;
            border: 2px solid #bde0ff;
            background: #ffffff;
            color: #1e3a8a;
            margin-bottom: 12px;
            font-size: 0.95rem;
            transition: all 0.2s ease;
          }

          .app-checker-input::placeholder {
            color: #5f9eff;
          }

          .app-checker-input:focus {
            border-color: #00a2ff;
            box-shadow: 0 0 6px rgba(0, 162, 255, 0.25);
            outline: none;
          }

          .check-btn {
            padding: 8px 14px;
            border-radius: 8px;
            border: 2px solid #00a2ff;
            background: #00a2ff;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            transition: 0.3s ease;
          }

          .check-btn:hover {
            background: #008fe0;
            box-shadow: 0 0 10px rgba(0, 162, 255, 0.3);
          }

          .result-box {
            margin-top: 14px;
            background: #f4faff;
            border: 1.5px solid #bde0ff;
            padding: 12px;
            border-radius: 8px;
            font-size: 0.95rem;
            color: #1e3a8a;
          }

          .error-text {
            color: #ff4d4f;
          }

          .result-text {
            color: #0056b3;
            line-height: 1.5;
          }

          @media (max-width: 600px) {
            header h1 {
              font-size: 1.6rem;
            }
            .dashboard-card h3 {
              font-size: 1.1rem;
            }
          }
        `}
      </style>

      <div className="student-dashboard">
        <div className="dashboard-container">
          <header>
            <h1>Student Dashboard</h1>
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/Student/Login');
              }}
            >
              {token ? 'Logout' : 'Login'}
            </button>
          </header>

          <section className="dashboard-section">
            <div className="dashboard-grid">
              {/* Browse Scholarships Card */}
              <div className="dashboard-card">
                <h3>Browse Scholarships</h3>
                <p>Find scholarships you can apply for. Carefully review eligibility & deadlines.</p>
                <button
                  className="view-btn"
                  onClick={() => navigate('/Student/ViewScholarships')}
                >
                  View Scholarships
                </button>
              </div>

              {/* Application Status Card */}
              <div className="dashboard-card">
                <h3>Check Application Status</h3>
                <p>Enter your application number to see status and donor decision.</p>
                <ApplicationStatusChecker />
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

const ApplicationStatusChecker = () => {
  const [applicationNo, setApplicationNo] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const checkStatus = async () => {
    if (!applicationNo)
      return setResult({ error: 'Please provide an application number' });
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(
        `http://localhost:3500/student/applicationstatus/${encodeURIComponent(applicationNo)}`
      );
      const data = await res.json();
      if (!res.ok) return setResult({ error: data.message || 'Unable to fetch' });
      setResult({ success: data });
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        value={applicationNo}
        onChange={(e) => setApplicationNo(e.target.value)}
        placeholder="Application No (e.g. APP-123)"
        className="app-checker-input"
      />
      <button
        onClick={checkStatus}
        disabled={loading}
        className="check-btn"
      >
        {loading ? 'Checking...' : 'Check'}
      </button>

      {result && (
        <div className="result-box">
          {result.error ? (
            <div className="error-text">{result.error}</div>
          ) : (
            <div className="result-text">
              <div><strong>Application:</strong> {result.success.applicationNo}</div>
              <div><strong>Status:</strong> {result.success.status}</div>
              <div><strong>Donor Decision:</strong> {result.success.donorDecision}</div>
              {result.success.donorRemarks && (
                <div><strong>Donor Remarks:</strong> {result.success.donorRemarks}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
