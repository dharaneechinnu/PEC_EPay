import React from 'react';

export default function ErrorPage({ message = 'Something went wrong' }) {
  return (
    <div className="error-page">
      <h2>Error</h2>
      <p>{message}</p>
    </div>
  );
}
