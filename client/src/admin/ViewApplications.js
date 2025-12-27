import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

// 🌟 Styled Components
const Container = styled.div`
  padding: 40px;
  background: #f9fbff; /* light white-blue background */
  min-height: 100vh;
  color: #1e3a8a;
  font-family: 'Poppins', sans-serif;
`;

/* --- Card --- */
const Card = styled.div`
  background: #ffffff;
  border: 2px solid #bde0ff; /* subtle sky blue border */
  border-radius: 12px;
  padding: 22px 26px;
  margin-bottom: 20px;
  box-shadow: 0 6px 12px rgba(0, 162, 255, 0.08);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    background: #f4faff;
    box-shadow: 0 8px 18px rgba(0, 162, 255, 0.12);
  }
`;

/* --- Title --- */
const Title = styled.h2`
  color: #00a2ff; /* vibrant sky blue */
  margin-bottom: 10px;
  font-size: 22px;
  font-weight: 700;
`;

/* --- Label --- */
const Label = styled.span`
  color: #5c6b80; /* soft gray-blue for labels */
  font-weight: 600;
  font-size: 14px;
`;

/* --- Value --- */
const Value = styled.span`
  color: #007bff; /* brighter blue for value text */
  margin-left: 6px;
  font-weight: 500;
`;

/* --- Status Badge --- */
const Status = styled.div`
  padding: 6px 14px;
  border-radius: 8px;
  display: inline-block;
  font-weight: 700;
  text-transform: capitalize;
  font-size: 13px;
  color: #ffffff;
  background: ${({ status }) =>
    status === 'approved'
      ? '#4dc37d' /* green */
      : status === 'funded'
      ? '#00a2ff' /* sky blue */
      : status === 'rejected'
      ? '#f74c4c' /* red */
      : status === 'submitted'
      ? '#ffb74d' /* amber */
      : '#9fb0c8'};
  box-shadow: 0 2px 5px rgba(0, 162, 255, 0.15);
`;

/* --- Layout helpers --- */
// Wrapper is an alias for Container to keep naming in JSX consistent
const Wrapper = Container;

const List = styled.div`
  margin-top: 18px; 
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// Item reuses Card styles
const Item = Card;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

// Use a styled button and avoid forwarding unexpected boolean props to the DOM
const Button = styled.button`
  background: #007bff;
  border: none;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: #005fcc;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;


const ViewApplications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ✅ Extract admin ID from localStorage
  const storedAdmin = JSON.parse(localStorage.getItem('adminAuth'));
  const adminId = storedAdmin?.admin?._id;

  const fetchApplications = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching applications for adminId:', adminId);
      const res = await axios.get(`http://localhost:3500/admin/getAllApplications/${adminId}`);
      if (res.status === 200 && res.data) {
        console.log('Applications fetched:', res.data.applications);
        // Hide applications that have been approved by donor (donorDecision === 'approved')
        const raw = res.data.applications || [];
        const visible = raw.filter(a => String(a.donorDecision || '').toLowerCase() === 'pending' && String(a.status || '').toLowerCase() !== 'pending');
        setApps(visible);
      } else {
        setError('Unexpected response from server');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  const viewApplication = async (applicationId) => {
    if (!applicationId) return;
    try {
      setActionLoading(true);
      const res = await axios.get(`http://localhost:3500/admin/applications/${applicationId}`);
      if (res && (res.status === 200 || res.status === 201) && res.data) {
        const app = res.data.application || res.data.application || null;
        // Do not show details if donorDecision is approved — hide complete details per requirement
        if (app && String(app.donorDecision || '').toLowerCase() === 'approved') {
          // clear any selected details and silently return
          setSelectedApp(null);
          return;
        }
        setSelectedApp(app);
      }
    } catch (err) {
      console.error('Error fetching application detail:', err?.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const approveApplication = async (applicationId) => {
    if (!applicationId) return;
    try {
      setActionLoading(true);
      // documentId in URL is not used by controller, pass a placeholder
      const res = await axios.patch(`http://localhost:3500/admin/applications/${applicationId}/documents/approve`, { status: 'approved' });
      if (res && res.status === 200) {
        // refresh list. Do NOT show details for an approved application (hide complete details)
        await fetchApplications();
        setSelectedApp(null);
      } else {
        console.warn('Unexpected response approving application', res);
      }
    } catch (err) {
      console.error('Error approving application:', err?.response?.data?.message || err.message);
      setError(err?.response?.data?.message || err.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    // intentionally run once on mount; fetchApplications is stable for this component
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchApplications();
  }, []);

  return (
    <Wrapper>
      <Title>🎓 Scholarship Applications</Title>

     

      {loading && <div>Loading applications...</div>}
      {error && <div style={{ color: 'salmon' }}>{error}</div>}

      <List>
        {apps.length === 0 && !loading && <div>No applications found</div>}
        {apps.map(app => (
          <Item key={app._id}>
            <Row>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px', color: '#a8d8ff' }}>
                  {app.studentname || 'Unknown Student'}
                </div>
                <Label>{app.studentemail}</Label>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Label>Status:</Label> <Value>{app.status}</Value>
                <br />
                {/* Hide donorDecision label when already approved as requested */}
                {app.donorDecision !== 'approved' && (
                  <>
                    <Label>Donor Decision:</Label> <Value>{app.donorDecision}</Value>
                  </>
                )}
              </div>
            </Row>

            <Row>
              <div>
                <Label>Gender:</Label> <Value>{app.gender}</Value>
              </div>
              <div>
                <Label>Institution:</Label> <Value>{app.institutionname}</Value>
              </div>
              <div>
                <Label>Class/Year:</Label> <Value>{app.classoryear}</Value>
              </div>
            </Row>

            <Row>
              <div>
                <Label>Family Income:</Label> <Value>₹{app.familyIncome}</Value>
              </div>
              <div>
                <Label>Scholarship:</Label> <Value>{app.scholarshipId?.scholarshipName}</Value>
              </div>
              <div>
                <Label>Amount:</Label> <Value>₹{app.scholarshipId?.scholarshipAmount}</Value>
              </div>
            </Row>

            <Row>
              <div>
                <Label>Verifier Email:</Label> <Value>{app.verifierId?.contactEmail || 'N/A'}</Value>
              </div>
              <div>
                <Label>Created At:</Label> <Value>{new Date(app.createdAt).toLocaleDateString()}</Value>
              </div>
            </Row>
            {app.firstGenGraduate && (
              <div style={{ marginTop: 8, fontSize: 13, color: '#66ff91' }}>
                🌟 First Generation Graduate
              </div>
            )}

            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            
              {/* Show Approve only when donorDecision is not approved */}
              {app.donorDecision !== 'approved' && (
                <Button style={{ background: '#16a34a' }} onClick={() => approveApplication(app._id)} disabled={actionLoading}>Approve</Button>
              )}
            </div>
          </Item>
        ))}
      </List>

      {selectedApp && (
        <div style={{ marginTop: 24 }}>
          <Title style={{ color: '#ffd580' }}>Application Details</Title>
          <Item style={{ background: '#081328' }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{selectedApp.studentname}</div>
            <div><Label>Scholarship:</Label> <Value>{selectedApp.scholarshipId?.scholarshipName}</Value></div>
            <div><Label>Institution:</Label> <Value>{selectedApp.institutionname}</Value></div>
            <div><Label>Family Income:</Label> <Value>₹{selectedApp.familyIncome}</Value></div>
            <div style={{ marginTop: 8 }}>
              <Label>Status:</Label> <Value>{selectedApp.status}</Value>
            </div>
            <div style={{ marginTop: 12 }}>
              <Button onClick={() => { setSelectedApp(null); }}>Close</Button>
            </div>
          </Item>
        </div>
      )}
    </Wrapper>
  );
};

export default ViewApplications;
