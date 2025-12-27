import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import styled from 'styled-components';
import authService from '../../services/authService';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const Title = styled.h1`
  text-align: center;
  color: #333;
  margin-bottom: 8px;
  font-size: 28px;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-size: 14px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Input = styled.input`
  padding: 12px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  &:focus { border-color: #10b981; outline: none; }
`;

const Button = styled.button`
  padding: 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const Divider = styled.div`
  text-align: center;
  margin: 20px 0;
  color: #999;
  &::before { content: "━━━━━━━━━━━━ "; }
  &::after { content: " ━━━━━━━━━━━━"; }
`;

const GoogleButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
  > div { width: 100% !important; }
  button { width: 100% !important; }
`;

const Message = styled.div`
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: center;
  color: ${props => props.error ? '#d32f2f' : '#1976d2'};
  background: ${props => props.error ? '#ffebee' : '#e3f2fd'};
`;

export default function PatientLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError(false);

    try {
      const user = await authService.login('patient', { email, password });
      setMessage('Login successful! Redirecting...');
      setTimeout(() => navigate('/patient'), 1500);
    } catch (err) {
      setError(true);
      setMessage(err.message || 'Login failed. Check credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setMessage('');
    setError(false);

    try {
      const token = credentialResponse.credential;
      // persist credential so logout can revoke it
      localStorage.setItem('google_credential', token);
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user = await authService.login('patient', {
        email: payload.email,
        googleToken: token,
      });
      setMessage('Google login successful! Redirecting...');
      setTimeout(() => navigate('/patient'), 1500);
    } catch (err) {
      setError(true);
      setMessage('Google login failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Title>Patient Login</Title>
        <Subtitle>Emergency Funding Support</Subtitle>

        {message && <Message error={error}>{message}</Message>}

        <Form onSubmit={handleEmailLogin}>
          <Input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </Form>

        <Divider>or</Divider>

        <GoogleButtonWrapper>
          <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || '564736339282-54m3ou7v5qg9ipv6trdlu1mahcteogvs.apps.googleusercontent.com'}>
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setMessage('Google login failed')} />
          </GoogleOAuthProvider>
        </GoogleButtonWrapper>
      </Card>
    </Container>
  );
}
