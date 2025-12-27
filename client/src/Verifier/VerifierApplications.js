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


const VerifierApplications = () => {
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Fetch all applications
  const fetchApplications = async () => {
    try {
      setLoading(true);
      // try to read verifier id from localStorage (login response)
      let verifierId = null;
      try {
        const raw = localStorage.getItem('verifierAuth');
        if (raw) {
          const parsed = JSON.parse(raw);
          verifierId = (parsed.verifier && parsed.verifier._id) || parsed._id || parsed.verifierId || null;
        }
      } catch (e) {
        console.warn('Could not parse verifierAuth from localStorage', e);
      }

      if (!verifierId) {
        setError('Verifier not logged in (verifierId missing)');
        setLoading(false);
        return;
      }

      const res = await axios.get('http://localhost:3500/verifier/getapplicationstatus', {
        params: { verifierId },
      });
      // controller returns { applications } for verifierId
      setApps(res.data.applications || res.data.applications || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching applications');
      setLoading(false);
    }
  };

  // ✅ Fetch one specific application by ID
  const viewApplication = async (id) => {
    try {
      console.log(`Fetching details for application ID: ${id}`);
      const res = await axios.get(`http://localhost:3500/verifier/viewapplicationbyid`, {
        params: { applicationId: id },
      });
      if (res && res.status === 200) {
        setSelectedApp(res.data.application);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // ✅ useEffect – fetch all apps first, then view the first one automatically
  useEffect(() => {
    const loadData = async () => {
      await fetchApplications();
    };
    loadData();
  }, []);

  // ✅ Once apps are fetched, automatically view first application
  useEffect(() => {
    if (apps.length > 0) {
      viewApplication(apps[0]._id);
    }
  }, [apps]);

  if (loading) return <Container>Loading applications...</Container>;
  if (error) return <Container style={{ color: 'salmon' }}>{error}</Container>;

  return (
    <Container>
      <h1 style={{ marginBottom: '20px', color: '#4fc3f7' }}>My Applications</h1>

      {apps.length === 0 ? (
        <div>No applications found</div>
      ) : (
        apps.map((a) => (
          <Card key={a._id}>
            <Title>{a.studentname}</Title>
            <div>
              <Label>Scholarship:</Label>
              <Value>{a.scholarshipId?.scholarshipName || 'N/A'}</Value>
            </div>
            <div>
              <Label>Email:</Label>
              <Value>{a.studentemail}</Value>
            </div>
            <div>
              <Label>Institution:</Label>
              <Value>{a.institutionname}</Value>
            </div>
            <div>
              <Label>Family Income:</Label>
              <Value>₹{a.familyIncome}</Value>
            </div>
            <div style={{ marginTop: '10px' }}>
              <Label>Status:</Label> <Status status={a.status}>{a.status}</Status>
            </div>
            {/* <button
              onClick={() => viewApplication(a._id)}
              style={{
                marginTop: '12px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#4fc3f7',
                border: 'none',
                color: '#0a1120',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              View Full Details
            </button> */}
          </Card>
        ))
      )}

      {selectedApp && (
        <Card style={{ border: '1px solid #4fc3f7' }}>
          <h2 style={{ color: '#03a9f4' }}>Application Details</h2>
          <div>
            <Label>Scholarship:</Label>
            <Value>{selectedApp.scholarshipId?.scholarshipName}</Value>
          </div>
          <div>
            <Label>Provider:</Label>
            <Value>{selectedApp.scholarshipId?.providerName}</Value>
          </div>
          <div>
            <Label>Amount:</Label>
            <Value>₹{selectedApp.scholarshipId?.scholarshipAmount}</Value>
          </div>
          <div>
            <Label>Deadline:</Label>
            <Value>
              {new Date(selectedApp.scholarshipId?.applicationDeadline).toLocaleDateString()}
            </Value>
          </div>
          <div>
            <Label>10th Marks:</Label>
            <Value>{selectedApp.tenthMarks}</Value>
          </div>
          <div>
            <Label>12th Marks:</Label>
            <Value>{selectedApp.twelfthMarks}</Value>
          </div>
          <div>
            <Label>CGPA:</Label>
            <Value>
              {selectedApp.semesterCgpa?.map((s) => `${s.semester}: ${s.cgpa}`).join(', ')}
            </Value>
          </div>
          <div>
            <Label>Remarks:</Label>
            <Value>{selectedApp.remarks || 'No remarks'}</Value>
          </div>
          <div style={{ marginTop: '10px' }}>
            <Label>Status:</Label>{' '}
            <Status status={selectedApp.status}>{selectedApp.status}</Status>
          </div>
        </Card>
      )}
    </Container>
  );
};

export default VerifierApplications;
