import React, { useState } from 'react';
import styled from 'styled-components';
import PendingDonors from './PendingDonors';
import PendingVerifiers from './PendingVerifiers';

/* ======= STYLED COMPONENTS ======= */
const Wrapper = styled.div`
  min-height: 100vh;
  background: #f4faff; /* light white-blue background */
  color: #1e3a8a;
  padding: 40px;
  box-sizing: border-box;
  font-family: 'Poppins', sans-serif;
`;

const Header = styled.h2`
  color: #00a2ff;
  font-size: 26px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 30px;
`;

const Nav = styled.div`
  display: flex;
  gap: 14px;
  justify-content: center;
  margin-bottom: 25px;
`;

const Tab = styled.button`
  padding: 10px 18px;
  border-radius: 8px;
  border: ${(p) => (p.active ? '2px solid #00a2ff' : '2px solid #bde0ff')};
  background: ${(p) => (p.active ? '#00a2ff' : '#ffffff')};
  color: ${(p) => (p.active ? '#ffffff' : '#007bff')};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${(p) =>
    p.active ? '0 3px 8px rgba(0, 162, 255, 0.2)' : '0 2px 6px rgba(0,0,0,0.03)'};

  &:hover {
    background: ${(p) => (p.active ? '#0092e5' : '#e8f6ff')};
    border-color: #00a2ff;
  }
`;

const Panels = styled.div`
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
`;

const Panel = styled.div`
  flex: 1;
  min-width: 420px;
  background: #ffffff;
  border: 2px solid #bde0ff;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 6px 12px rgba(0, 162, 255, 0.08);
`;

/* ======= MAIN COMPONENT ======= */
export default function SuperAdminDashboard() {
  const [tab, setTab] = useState('pending');

  return (
    <Wrapper>
      <Header>Super Admin Panel</Header>

      <Nav>
        <Tab active={tab === 'pending'} onClick={() => setTab('pending')}>
          Pending Requests
        </Tab>
        
      </Nav>

      {tab === 'pending' ? (
        <Panels>
          <Panel>
            <PendingDonors />
          </Panel>
          <Panel>
            <PendingVerifiers />
          </Panel>
        </Panels>
      ) : (
        <Panels>
          {/* <Panel>
            <ReviewDonor />
          </Panel>
          <Panel>
            <ReviewVerifier />
          </Panel> */}
        </Panels>
      )}
    </Wrapper>
  );
}
