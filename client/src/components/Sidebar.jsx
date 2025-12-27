import React from 'react';

export default function Sidebar({ children }) {
  return (
    <aside className="sidebar">
      <ul>
        <li>Dashboard</li>
        <li>Requests</li>
        <li>Transactions</li>
      </ul>
      <div className="sidebar-content">{children}</div>
    </aside>
  );
}
