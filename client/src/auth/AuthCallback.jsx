import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  useEffect(() => {
    // handle OAuth callback, parse token, store session
    // placeholder: redirect to landing
    navigate('/');
  }, [navigate]);

  return <div>Signing you in...</div>;
}
