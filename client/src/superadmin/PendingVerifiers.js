import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';

/* === THEME STYLING === */
const Container = styled.div`
  padding: 24px;
  background: #ffffff;
  color: #1e3a8a;
  border-radius: 12px;
  border: 2px solid #bde0ff;
  box-shadow: 0 4px 10px rgba(0, 162, 255, 0.08);
  font-family: 'Poppins', sans-serif;
`;

const Title = styled.h3`
  color: #00a2ff;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1.5px solid #e8f4ff;
  transition: background 0.2s ease;

  &:hover {
    background: #f4faff;
  }
`;

const Info = styled.div`
  font-size: 14px;
  color: #1e3a8a;

  div:first-child {
    font-weight: 700;
    color: #007bff;
  }

  div:last-child {
    color: #4b5563;
    font-size: 13px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
`;

const Approve = styled(Button)`
  background: #00a86b;
  color: #fff;
  &:hover {
    background: #00945f;
    box-shadow: 0 3px 6px rgba(0, 168, 107, 0.3);
  }
`;

const Reject = styled(Button)`
  background: #ff4d4f;
  color: #fff;
  &:hover {
    background: #e23e40;
    box-shadow: 0 3px 6px rgba(255, 77, 79, 0.3);
  }
`;

export default function PendingVerifiers() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:3500/superadmin/pending-verifiers?page=1&limit=25`
      );
      setList(res.data.verifiers || []);
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const review = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:3500/superadmin/review-verifier/${id}`,
        { status }
      );
      setList((prev) => prev.filter((d) => d._id !== id));
      const successMsg =
        status === 'approved'
          ? 'Verifier approved successfully'
          : 'Verifier rejected';
      setMsg(successMsg);
      setMsgType('success');
      window.alert(successMsg);
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
      setMsgType('error');
    }
  };

  return (
    <Container>
      <Title>Pending Verifiers</Title>
      {msg && (
        <div style={{ color: msgType === 'success' ? '#00a86b' : '#ff4d4f' }}>
          {msg}
        </div>
      )}
      {loading && <div>Loading...</div>}
      {list.length === 0 && !loading && <div>No pending verifiers</div>}
      {list.map((d) => (
        <Row key={d._id}>
          <Info>
            <div>{d.Inititutename || d.institutionName || d.name}</div>
            <div>{d.contactEmail}</div>
          </Info>
          <Actions>
            <Approve onClick={() => review(d._id, 'approved')}>Approve</Approve>
            <Reject onClick={() => review(d._id, 'rejected')}>Reject</Reject>
          </Actions>
        </Row>
      ))}
    </Container>
  );
}
