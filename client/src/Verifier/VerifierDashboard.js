import React, { useState } from 'react';
import styled from 'styled-components';
import VerifierViewScholarships from './VerifierViewScholarships';
import VerifierApplications from './VerifierApplications';
import VerifierApply from './VerifierApply';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

/* ===== Dashboard Wrapper ===== */
const DashboardWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f9fbff; /* soft white-blue background */
  color: #1e3a8a;
  font-family: 'Poppins', sans-serif;
`;

/* ===== Sidebar ===== */
const Sidebar = styled.aside`
  width: ${drawerWidth}px;
  background: #ffffff; /* pure white sidebar */
  border-right: 2px solid #cfe8ff;
  padding: 24px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 18px;
  box-shadow: 2px 0 10px rgba(0, 162, 255, 0.08);
`;

/* ===== Logo ===== */
const Logo = styled.div`
  font-weight: 700;
  color: #00a2ff;
  margin-bottom: 20px;
  font-size: 22px;
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

/* ===== Navigation ===== */
const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const NavButton = styled.button`
  padding: 10px 14px;
  border-radius: 8px;
  background: ${(props) => (props.active ? "#00a2ff" : "#ffffff")};
  color: ${(props) => (props.active ? "#ffffff" : "#00a2ff")};
  border: 2px solid #00a2ff;
  text-align: left;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  width: 100%;
  transition: all 0.15s ease;
  box-shadow: ${(props) =>
    props.active ? "0 3px 6px rgba(0, 162, 255, 0.2)" : "none"};

  &:hover {
    background: ${(props) => (props.active ? "#0092e5" : "#eaf5ff")};
  }
`;

/* ===== Main Content ===== */
const Content = styled.main`
  flex: 1;
  padding: 32px;
  background: #ffffff;
  box-sizing: border-box;
  border-left: 2px solid #e6f3ff;
  display: flex;
  flex-direction: column;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.02);
`;

/* ===== Header ===== */
const Header = styled.div`
  margin-bottom: 22px;
  border-bottom: 2px solid #e6f3ff;
  padding-bottom: 10px;
`;

const Title = styled.h1`
  font-size: 24px;
  color: #00a2ff; /* vibrant sky blue */
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.5px;
`;


const VerifierDashboard = () => {
  const [active, setActive] = useState('view');
  const navigate = useNavigate();

  // read verifier info
  let stored = null;
  try {
    const raw = localStorage.getItem('verifierAuth');
    if (raw) stored = JSON.parse(raw).verifier || JSON.parse(raw);
  } catch (e) {
    console.warn('could not parse verifierAuth', e);
  }

  const handleLogout = () => {
    try {
      // clear everything stored in localStorage/sessionStorage on logout
      localStorage.clear();
      try { sessionStorage.clear(); } catch (e) {}
    } catch (e) {
      // fall back to removing known key
      try { localStorage.removeItem('verifierAuth'); } catch (err) {}
    }
    // redirect to the verifier login route
    navigate('/Verifier/Login');
  };

  const renderContent = () => {
    switch(active) {
      case 'view': return <VerifierViewScholarships />;
      case 'apply': return <VerifierApply />;
      case 'apps': return <VerifierApplications />;
      default: return <VerifierViewScholarships />;
    }
  };

  return (
    <DashboardWrapper>
      <Sidebar>
        <Logo>{stored ? (stored.Inititutename || stored.institutionName || 'Verifier') : 'Verifier'}</Logo>
        <div style={{marginBottom:12, fontSize:13, color:'#9fb0c8'}}>
          {stored ? (stored.contactEmail || '') : 'Not signed in'}
        </div>
        <Nav>
          <NavButton active={active === 'view'} onClick={() => setActive('view')}>View Scholarships</NavButton>
          {/* <NavButton active={active === 'apply'} onClick={() => setActive('apply')}>Apply for Student</NavButton> */}
          <NavButton active={active === 'apps'} onClick={() => setActive('apps')}>My Applications</NavButton>
        </Nav>

        <div style={{marginTop:20}}>
          <button onClick={handleLogout} style={{padding:'8px 12px', borderRadius:8, background:'#ff4d4f', color:'#fff', border:'none'}}>Logout</button>
        </div>
      </Sidebar>

      <Content>
        <Header>
          <Title>{active === 'view' ? 'Available Scholarships' : active === 'apply' ? 'Apply for Student' : 'My Applications'}</Title>
        </Header>
        {renderContent()}
      </Content>
    </DashboardWrapper>
  );
};

export default VerifierDashboard;
