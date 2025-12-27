import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";

const Wrapper = styled.div`
  min-height: 100vh;
  background: #f9fbff; /* soft blue-white background */
  color: #1e3a8a;
  padding: 40px;
  font-family: 'Poppins', sans-serif;
`;

/* ---- Title ---- */
const Title = styled.h2`
  text-align: center;
  font-size: 28px;
  margin-bottom: 30px;
  color: #00a2ff; /* vibrant sky blue */
  font-weight: 700;
  letter-spacing: 0.5px;
`;

/* ---- Card List ---- */
const List = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 22px;
`;

/* ---- Card ---- */
const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 22px;
  width: 340px;
  border: 2px solid #bde0ff;
  transition: all 0.3s ease;
  box-shadow: 0 6px 15px rgba(0, 162, 255, 0.1);

  &:hover {
    transform: translateY(-4px);
    background: #f4faff;
    box-shadow: 0 10px 20px rgba(0, 162, 255, 0.15);
  }
`;

/* ---- Rows ---- */
const Row = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
`;

/* ---- Label ---- */
const Label = styled.span`
  color: #6b7280; /* muted blue-gray label text */
  font-size: 13px;
  font-weight: 600;
`;

/* ---- Value ---- */
const Value = styled.span`
  color: #007bff;
  font-weight: 600;
  font-size: 14px;
`;

/* ---- Button ---- */
const Button = styled.button`
  background: linear-gradient(90deg, #00a2ff, #4db8ff);
  color: #ffffff;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  margin-top: 15px;
  transition: all 0.2s ease;
  box-shadow: 0 3px 8px rgba(0, 162, 255, 0.25);

  &:hover {
    background: linear-gradient(90deg, #0092e5, #33b1ff);
    transform: translateY(-2px);
  }
`;

/* ---- Message ---- */
const Message = styled.div`
  color: ${(props) => (props.type === "error" ? "#f44336" : "#00a2ff")};
  background: ${(props) =>
    props.type === "error"
      ? "rgba(244, 67, 54, 0.08)"
      : "rgba(0, 162, 255, 0.08)"};
  padding: 10px;
  border-radius: 6px;
  margin-top: 20px;
  text-align: center;
  font-weight: 600;
`;


const MakePayment = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const storedAdmin = JSON.parse(localStorage.getItem("adminAuth"));
  const adminId = storedAdmin?.admin?._id;

  // ✅ Fetch all approved applications
  const fetchApprovedApplications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:3500/admin/getAllApplications/${adminId}`);
      const allApps = res.data.applications || [];
      const approvedApps = allApps.filter(app => String(app.donorDecision).toLowerCase() === "approved");
      setApplications(approvedApps);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedApplications();
  }, []);

  // ✅ Handle payment for each application
  const handlePayment = async (applicationId) => {
    setMessage("");
    try {
      const orderRes = await axios.post(
        `http://localhost:3500/admin/applications/${applicationId}/create-order`
      );

      if (!orderRes || orderRes.status !== 201) {
        setMessage("❌ Failed to create payment order");
        return;
      }

      const { order, key } = orderRes.data;

      const options = {
        key: key || process.env.REACT_APP_RAZORPAY_KEY_ID || "rzp_test_your_key_here",
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Scholarship Payment",
        description: `Payment for Application ${applicationId}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyRes = await axios.post(
              `http://localhost:3500/admin/applications/${applicationId}/verify-payment`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }
            );

            if (verifyRes.status !== 200) {
              setMessage("⚠️ Payment verification failed");
              return;
            }

            setMessage("✅ Payment verified successfully! Processing payout...");

            // Trigger payout
            const payoutRes = await axios.patch(
              `http://localhost:3500/admin/applications/${applicationId}/makepayout`
            );

            if (payoutRes.status === 200) {
              setMessage("✅ Payment and payout completed successfully! Sending receipts...");
              // Request server to send receipts (student + verifier)
              try {
                await axios.post(`http://localhost:3500/admin/applications/${applicationId}/send-receipts`);
                setMessage("✅ Payment, payout and receipts completed successfully!");
              } catch (sendErr) {
                console.warn('Failed to trigger receipts:', sendErr);
                setMessage("⚠️ Payment completed but sending receipts failed. Check server logs.");
              }
              fetchApprovedApplications();
            } else {
              setMessage("⚠️ Payout failed. Please check logs.");
            }
          } catch (verifyErr) {
            setMessage(`⚠️ Error verifying payment: ${verifyErr.message}`);
          }
        },
        prefill: {
          name: "Admin",
          email: "admin@example.com",
        },
        theme: { color: "#ffae00" },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setMessage("⚠️ Razorpay SDK not loaded. Add checkout.js script.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setMessage(`⚠️ ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <Wrapper>
      <Title>💳 Approved Applications - Make Payment</Title>

      {loading && <div>Loading approved applications...</div>}
      {!loading && applications.length === 0 && <div>No approved applications found</div>}

      <List>
        {applications.map((app) => (
          <Card key={app._id}>
            <Row>
              <Label>Student:</Label> <Value>{app.studentname}</Value>
            </Row>
            <Row>     
            </Row>
            <Row>
              <Label>Institution:</Label> <Value>{app.institutionname}</Value>
            </Row>
            <Row>
              <Label>Scholarship:</Label> <Value>{app.scholarshipId?.scholarshipName}</Value>
            </Row>
            <Row>
              <Label>FundedAmount:</Label> <Value>₹{app.fundedraised}</Value>
            </Row>
            <Row>
              <Label>Created:</Label>{" "}
              <Value>{new Date(app.createdAt).toLocaleDateString()}</Value>
            </Row>

            <Button onClick={() => handlePayment(app._id)}>Make Payment</Button>
          </Card>
        ))}
      </List>

      {message && <Message type={message.startsWith("❌") || message.startsWith("⚠️") ? "error" : "success"}>{message}</Message>}
    </Wrapper>
  );
};

export default MakePayment;
