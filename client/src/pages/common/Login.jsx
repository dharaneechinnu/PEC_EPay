import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 50px 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 12px;
  font-size: 32px;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #666;
  margin-bottom: 40px;
  font-size: 15px;
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const RoleCard = styled.button`
  padding: 30px;
  border: 2px solid ${props => props.color};
  background: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  &:hover {
    background: ${props => props.color};
    color: white;
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 13px;
    opacity: 0.8;
  }
`;

const AdminCard = styled(RoleCard)`
  border-color: #667eea;
  color: #667eea;
  &:hover {
    background: #667eea;
    color: white;
  }
`;

const HospitalCard = styled(RoleCard)`
  border-color: #00a2ff;
  color: #00a2ff;
  &:hover {
    background: #00a2ff;
    color: white;
  }
`;

const PatientCard = styled(RoleCard)`
  border-color: #10b981;
  color: #10b981;
  &:hover {
    background: #10b981;
    color: white;
  }
`;

const DemoCard = styled.div`
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.6;

  strong {
    display: block;
    margin-bottom: 8px;
    color: #333;
  }

  code {
    background: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
  }
`;

export default function Login() {
  const navigate = useNavigate();

  return (
    <Container>
      <Card>
        <Title>Medical Emergency Fund</Title>
        <Subtitle>Select your login type to continue</Subtitle>

        <RoleGrid>
          <AdminCard onClick={() => navigate('/login/admin')}>
            <h3>👨‍💼</h3>
            <h3>Admin</h3>
            <p>System Administrator</p>
          </AdminCard>

          <HospitalCard onClick={() => navigate('/login/hospital')}>
            <h3>🏥</h3>
            <h3>Hospital</h3>
            <p>Hospital Staff</p>
          </HospitalCard>

          <PatientCard onClick={() => navigate('/login/patient')}>
            <h3>👤</h3>
            <h3>Patient</h3>
            <p>Patient Account</p>
          </PatientCard>
        </RoleGrid>

        <DemoCard>
          <strong>Demo Credentials:</strong>
          <code>Email: demo@example.com</code>
          <code>Password: demo123</code>
          <p style={{ margin: '8px 0 0 0' }}>Or use Google Sign-In on the next page.</p>
        </DemoCard>
      </Card>
    </Container>
  );
}
