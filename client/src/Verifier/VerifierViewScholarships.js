import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';

// 🔹 Styled Components
const Container = styled.div`
  padding: 40px;
  background: #f4faff; /* soft white-blue base */
  min-height: 100vh;
  color: #1e3a8a;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

/* ---- CARD GRID ---- */
const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
  width: 100%;
  max-width: 1100px;
`;

/* ---- CARD ---- */
const Card = styled.div`
  background: #ffffff;
  border: 2px solid #bde0ff;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 6px 14px rgba(77, 170, 252, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 18px rgba(0, 162, 255, 0.15);
    border-color: #4daafc;
  }
`;

/* ---- TITLE ---- */
const Title = styled.h2`
  font-size: 20px;
  color: #00a2ff; /* sky blue heading */
  margin-bottom: 8px;
  font-weight: 700;
`;

/* ---- PROVIDER ---- */
const Provider = styled.h4`
  font-size: 14px;
  color: #4daafc;
  margin-bottom: 16px;
  font-weight: 600;
`;

/* ---- FIELD ---- */
const Field = styled.div`
  margin-bottom: 8px;
  font-size: 15px;
  color: #1e40af;
`;

/* ---- LABEL ---- */
const Label = styled.span`
  color: #4daafc;
  font-weight: 600;
`;

/* ---- VALUE ---- */
const Value = styled.span`
  color: #1e3a8a;
  margin-left: 6px;
  font-weight: 500;
`;

/* ---- BUTTON ---- */
const Button = styled.button`
  margin-top: 16px;
  background: #4daafc;
  color: #ffffff;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 3px 8px rgba(0, 162, 255, 0.2);

  &:hover {
    background: #00a2ff;
    box-shadow: 0 5px 10px rgba(0, 162, 255, 0.25);
  }
`;


const VerifierViewScholarships = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:3500/verifier/getallscholarships');
      if (res && res.status === 200) setList(res.data.scholarships || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  if (loading) return <Container>Loading scholarships...</Container>;
  if (error) return <Container style={{ color: 'salmon' }}>{error}</Container>;

  return (
    <Container>
      <h1 style={{ marginBottom: '20px', color: '#4fc3f7' }}>Available Scholarships</h1>

      {list.length === 0 ? (
        <div>No scholarships found</div>
      ) : (
        <CardGrid>
          {list.map(s => (
            <Card key={s._id}>
              <Title>{s.scholarshipName || s.title}</Title>
              <Provider>Provided by: {s.providerName || 'N/A'}</Provider>

              <Field>
                <Label>Amount:</Label>
                <Value>₹{s.scholarshipAmount}</Value>
              </Field>
              <Field>
                <Label>Deadline:</Label>
                <Value>{new Date(s.applicationDeadline).toLocaleDateString()}</Value>
              </Field>
              <Field>
                <Label>Required 10th Marks:</Label>
                <Value>{s.eligibilityCriteria?.tenthMarks}%</Value>
              </Field>
              <Field>
                <Label>Required 12th Marks:</Label>
                <Value>{s.eligibilityCriteria?.twelfthMarks}%</Value>
              </Field>
              <Field>
                <Label>College CGPA:</Label>
                <Value>{s.eligibilityCriteria?.collegeCGPA}</Value>
              </Field>
              <Field>
                <Label>Max Parent Income:</Label>
                <Value>₹{s.eligibilityCriteria?.maxParentIncome}</Value>
              </Field>
              <Field>
                <Label>Women Preference:</Label>
                <Value>{s.eligibilityCriteria?.womenPreference ? 'Yes' : 'No'}</Value>
              </Field>
              <Field>
                <Label>First Gen Graduate:</Label>
                <Value>{s.eligibilityCriteria?.firstGenGraduate ? 'Yes' : 'No'}</Value>
              </Field>

              <Field style={{ marginTop: '10px' }}>
                <Label>Description:</Label>
                <Value>{s.description}</Value>
              </Field>

              <Button onClick={() => {
                const donorid = s.createdBy && s.createdBy._id ? s.createdBy._id : s.createdBy;
                navigate('/Verifier/Apply', { state: { scholarshipId: s._id, scholarshipName: s.scholarshipName || s.title, donorid } });
              }}>
                Apply Now
              </Button>
            </Card>
          ))}
        </CardGrid>
      )}
    </Container>
  );
};

export default VerifierViewScholarships;
