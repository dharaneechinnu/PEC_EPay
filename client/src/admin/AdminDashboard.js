import React, { useState, useEffect } from "react";
import styled from "styled-components";
import MakePayment from "./MakePayment";
import ViewApplications from './ViewApplications';
import CreateScholar from './CreateScholar';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 250;

/* ---- WRAPPER ---- */
const DashboardWrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f4faff;
  font-family: 'Poppins', sans-serif;
`;

/* ---- SIDEBAR ---- */
const Sidebar = styled.aside`
  width: ${drawerWidth}px;
  background: #ffffff;
  border-right: 2px solid #cfe8ff;
  padding: 24px 18px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  position: relative;

  /* Mobile behaviour */
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: 80%;
    max-width: 320px;
    transform: translateX(${(props) => (props.open ? "0" : "-110%")});
    transition: transform 220ms ease;
    z-index: 60;
    border-right: none;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    padding-top: 50px;
  }
`;

/* ---- LOGOUT BUTTON ---- */
const LogoutButtonTop = styled.button`
  position: absolute;
  top: 16px;
  left: 16px;
  background: #ff4d4f;
  border: none;
  color: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.25s ease;

  &:hover {
    background: #e04345;
  }

  @media (max-width: 768px) {
    top: 10px;
    left: 10px;
    padding: 7px 12px;
    font-size: 12px;
  }
`;

/* ---- LOGO ---- */
const Logo = styled.div`
  font-size: 22px;
  font-weight: 700;
  color: #00a2ff;
  text-align: left;
  margin-bottom: 18px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

/* ---- EMAIL BOX ---- */
const EmailBox = styled.div`
  background: #f4faff;
  border: 1.5px solid #bde0ff;
  border-radius: 8px;
  padding: 14px 12px;
  margin-bottom: 25px;
  text-align: left;
  box-shadow: 0 2px 5px rgba(0, 162, 255, 0.08);
`;

const EmailTitle = styled.div`
  font-size: 13px;
  color: #007bff;
  font-weight: 600;
`;

const EmailText = styled.div`
  font-size: 13px;
  color: #1e40af;
  margin-top: 4px;
  word-break: break-word;
`;

/* ---- NAVIGATION ---- */
const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
`;

const NavButton = styled.button`
  background: ${(props) => (props.active ? "#00a2ff" : "#ffffff")};
  color: ${(props) => (props.active ? "#ffffff" : "#00a2ff")};
  border: 2px solid #00a2ff;
  padding: 10px 14px;
  border-radius: 8px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: ${(props) =>
    props.active ? "0 3px 6px rgba(0, 162, 255, 0.2)" : "none"};

  &:hover {
    background: ${(props) => (props.active ? "#0092e5" : "#e8f6ff")};
  }
`;

/* ---- MAIN CONTENT ---- */
const Content = styled.main`
  flex: 1;
  background: #ffffff;
  padding: 40px;
  box-sizing: border-box;
  border-left: 2px solid #eaf3ff;
  display: flex;
  flex-direction: column;
  transition: padding 160ms ease;

  @media (max-width: 768px) {
    padding: 18px;
    border-left: none;
  }
`;

/* ---- HEADER ---- */
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  border-bottom: 2px solid #eaf3ff;
  padding-bottom: 10px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Hamburger = styled.button`
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  width: 36px;
  height: 36px;
  padding: 6px;
  border-radius: 8px;

  &:hover { background: #eaf6ff; }

  @media (max-width: 768px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  span {
    display: block;
    width: 18px;
    height: 2px;
    background: #00a2ff;
    border-radius: 2px;
    box-shadow: 0 6px 0 #00a2ff, 0 -6px 0 #00a2ff;
  }
`;

const Overlay = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: ${(props) => (props.show ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.28);
    z-index: 50;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  color: #00a2ff;
  margin: 0;
  font-weight: 700;
  letter-spacing: 0.4px;
`;
/* ---- MAIN COMPONENT ---- */
const AdminDashboard = () => {
  const [active, setActive] = useState('view');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    const onResize = () => check();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    // when switching to mobile, close sidebar by default
    if (isMobile) setSidebarOpen(false);
    else setSidebarOpen(true);
  }, [isMobile]);

  // read admin info from localStorage
  let storedAdmin = null;
  try {
    const raw = localStorage.getItem('adminAuth');
    if (raw) storedAdmin = JSON.parse(raw).admin || JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse adminAuth from localStorage', e);
  }

  const handleLogout = () => {
    try {
      localStorage.clear();
      try { sessionStorage.clear(); } catch (err) {}
    } catch (e) {
      console.warn('Error clearing localStorage during logout', e);
      try { localStorage.removeItem('adminAuth'); } catch (err) {}
    }
    navigate('/admin/login');
  };

  const renderContent = () => {
    switch (active) {
      case 'view':
        return <ViewApplications />;
      case 'create':
        return <CreateScholar />;
      case 'payment':
        return <MakePayment onBack={() => setActive('view')} />;
      default:
        return <ViewApplications />;
    }
  };

  return (
    <DashboardWrapper>
      {/* Overlay for mobile when sidebar is open */}
      <Overlay show={isMobile && sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <Sidebar open={sidebarOpen}>
  {/* 🔴 Logout Button moved to top-left */}
  <LogoutButtonTop onClick={handleLogout}>Logout</LogoutButtonTop>

  <Logo style={{ marginTop: "40px" }}>Admin Panel</Logo>

  {/* ✉️ Admin Email Box */}
  <EmailBox>
    <EmailTitle>Admin Email</EmailTitle>
    <EmailText>
      {storedAdmin?.contactEmail || storedAdmin?.email || "Not available"}
    </EmailText>
  </EmailBox>

  {/* 🔹 Navigation Buttons */}
  <Nav>
    <NavButton
      active={active === "view"}
      onClick={() => {
        setActive("view");
        if (isMobile) setSidebarOpen(false);
      }}
    >
      View Applications
    </NavButton>
    <NavButton
      active={active === "create"}
      onClick={() => {
        setActive("create");
        if (isMobile) setSidebarOpen(false);
      }}
    >
      Create Scholar
    </NavButton>
    <NavButton
      active={active === "payment"}
      onClick={() => {
        setActive("payment");
        if (isMobile) setSidebarOpen(false);
      }}
    >
      Make Payment
    </NavButton>
  </Nav>
</Sidebar>


      <Content>
        <Header>
          <Title>
            {active === 'view'
              ? 'View Applications'
              : active === 'create'
              ? 'Create Scholarship'
              : 'Make Payment'}
          </Title>
        </Header>

        {renderContent()}
      </Content>
    </DashboardWrapper>
  );
};



export default AdminDashboard;
