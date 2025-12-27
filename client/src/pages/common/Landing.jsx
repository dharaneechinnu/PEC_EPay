import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div>
      <h1>Welcome to Medical Emergency Fund</h1>
      <p>Get instant help during medical emergencies—hospitals, patients and donors connected.</p>
      <Link to="/login">Log in</Link>
    </div>
  );
}
