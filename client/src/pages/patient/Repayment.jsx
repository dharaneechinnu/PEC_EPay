import React, { useState, useEffect } from 'react';
import patientService from '../../services/patientService';

export default function Repayment() {
  const [fundedRequests, setFundedRequests] = useState([]);
  const [emiHistory, setEmiHistory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchFundedRequests();
  }, []);

  const fetchFundedRequests = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        setError('User not found. Please login again.');
        return;
      }
      
      const user = JSON.parse(userString);
      const patientemail = user.email;
      
      const response = await patientService.getMyRequests(patientemail);
      const allRequests = response.applications || [];
      
      // Filter only funded/disbursed requests
      const funded = allRequests.filter(req => 
        ['funded', 'disbursed'].includes(req.status?.toLowerCase()) && 
        req.approvedAmount > 0
      );
      
      setFundedRequests(funded);
      
      // Fetch EMI history for each request
      const histories = {};
      for (const request of funded) {
        try {
          const history = await patientService.getEMIHistory(request._id);
          histories[request._id] = history;
        } catch (err) {
          console.error(`Error fetching EMI history for ${request._id}:`, err);
        }
      }
      setEmiHistory(histories);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch funded requests');
    } finally {
      setLoading(false);
    }
  };

  const calculateEMI = (principal, months = 12) => {
    const monthlyInterestRate = 0.01; // 1% per month
    const emi = (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, months)) / 
                (Math.pow(1 + monthlyInterestRate, months) - 1);
    return {
      emi: Math.round(emi),
      totalAmount: Math.round(emi * months),
      interest: Math.round((emi * months) - principal),
      principal,
      months,
      monthlyInterestRate: monthlyInterestRate * 100
    };
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const initiateRazorpayPayment = async (request, emiAmount) => {
    try {
      setError(null);
      
      // First create payment order
      console.log('Creating payment order for:', { requestId: request._id, amount: emiAmount });
      
      const orderResponse = await patientService.createEMIPaymentOrder(request._id, emiAmount);
      console.log('Order created:', orderResponse);
      
      if (!orderResponse || !orderResponse.orderId) {
        throw new Error('Failed to create payment order - no order ID received');
      }

      const options = {
        key: 'rzp_test_epPmzNozAIcJcC',
        amount: orderResponse.amount || (emiAmount * 100),
        currency: orderResponse.currency || 'INR',
        order_id: orderResponse.orderId, // Use order ID from backend
        name: 'Medical Emergency Fund - EMI Payment',
        description: `EMI Payment for ${request.ApplicationNo}`,
        handler: async (response) => {
          try {
            console.log('Razorpay payment response:', response);
            
            // Extract payment details with fallbacks
            const paymentId = response.razorpay_payment_id || response.payment_id;
            const orderId = response.razorpay_order_id || response.order_id || orderResponse.orderId;
            const signature = response.razorpay_signature || response.signature;
            
            console.log('Extracted payment details:', { paymentId, orderId, signature });
            
            if (!paymentId || !orderId || !signature) {
              throw new Error('Missing payment details from Razorpay response');
            }
            
            const verifyResponse = await patientService.verifyEMIPayment({
              requestId: request._id,
              paymentId: paymentId,
              orderId: orderId,
              signature: signature,
              amount: emiAmount,
              patientEmail: request.studentemail || request.patientemail || ''
            });

            console.log('Verification response:', verifyResponse);
            alert('✅ EMI payment successful! Payment ID: ' + paymentId);
            fetchFundedRequests(); // Refresh data
          } catch (err) {
            console.error('Payment verification error:', err);
            alert('❌ Payment verification failed: ' + err.message);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
          }
        },
        prefill: {
          name: request.patientname || request.studentname || '',
          email: request.patientemail || request.studentemail || '',
        },
        theme: {
          color: '#00a2ff'
        },
        retry: {
          enabled: true,
          max_count: 3
        }
      };

      console.log('Opening Razorpay with options:', options);
      
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function(response) {
        console.error('Payment failed:', response.error);
        alert(`❌ Payment failed: ${response.error.description}`);
      });
      
      rzp.open();
      
    } catch (err) {
      console.error('Payment initiation error:', err);
      setError('Failed to initiate payment: ' + err.message);
    }
  };

  const generateEMIPDF = async (request, emiData) => {
    try {
      const response = await patientService.generateEMIPDF(request._id, emiData);
      // PDF download should be handled by the backend
    } catch (err) {
      setError('Failed to generate PDF: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{minHeight:'100vh',padding:40,background:'#f4faff'}}>
        <div style={{maxWidth:1200,margin:'0 auto',textAlign:'center',padding:50}}>
          <div style={{fontSize:'18px',color:'#00a2ff'}}>Loading repayment options...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',padding:40,background:'#f4faff'}}>
      <div style={{maxWidth:1200,margin:'0 auto',background:'#fff',border:'1px solid #dceeff',borderRadius:12,padding:30}}>
        <header style={{marginBottom:30}}>
          <h1 style={{margin:0,color:'#00a2ff'}}>EMI Repayment Center</h1>
          <p style={{color:'#6c757d',margin:'10px 0 0 0'}}>
            Manage your monthly installments for funded medical emergency amounts
          </p>
        </header>

        {error && (
          <div style={{marginBottom:20,padding:15,background:'#ffeaea',border:'1px solid #ffcccb',borderRadius:8,color:'#d8000c'}}>
            {error}
          </div>
        )}

        {fundedRequests.length === 0 ? (
          <div style={{textAlign:'center',padding:60,background:'#f8f9fa',borderRadius:8}}>
            <h3 style={{color:'#6c757d',margin:'0 0 10px 0'}}>No funded requests available</h3>
            <p style={{color:'#6c757d',margin:0}}>EMI options are available only for funded or disbursed requests</p>
          </div>
        ) : (
          <div>
            <div style={{marginBottom:30,display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))',gap:20}}>
              {fundedRequests.map((request) => {
                const emi12 = calculateEMI(request.approvedAmount, 12);
                const history = emiHistory[request._id];
                const totalPaid = history?.totalPaid || 0;
                const remainingAmount = request.approvedAmount - totalPaid;
                
                return (
                  <div key={request._id} style={{border:'1px solid #e9ecef',borderRadius:8,padding:20,background:'#fff'}}>
                    <div style={{marginBottom:15}}>
                      <h4 style={{margin:0,color:'#212529',fontSize:'16px'}}>{request.ApplicationNo}</h4>
                      <p style={{margin:'5px 0',color:'#6c757d',fontSize:'14px'}}>{request.medicalCondition}</p>
                      <div style={{fontSize:'12px',color:'#6c757d'}}>
                        Emergency Type: {request.emergencyType?.charAt(0).toUpperCase() + request.emergencyType?.slice(1)}
                      </div>
                    </div>

                    <div style={{marginBottom:15,padding:10,background:'#f8f9fa',borderRadius:4}}>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,fontSize:'13px'}}>
                        <div><strong>Approved:</strong> {formatAmount(request.approvedAmount)}</div>
                        <div><strong>Paid:</strong> {formatAmount(totalPaid)}</div>
                        <div><strong>Remaining:</strong> {formatAmount(remainingAmount)}</div>
                        <div><strong>Payments:</strong> {history?.totalPayments || 0}</div>
                      </div>
                    </div>

                    <div style={{marginBottom:15}}>
                      <h5 style={{margin:0,marginBottom:8,color:'#495057',fontSize:'14px'}}>12-Month EMI Plan</h5>
                      <div style={{fontSize:'12px',lineHeight:1.4}}>
                        <div><strong>Monthly EMI:</strong> {formatAmount(emi12.emi)}</div>
                        <div><strong>Total Amount:</strong> {formatAmount(emi12.totalAmount)}</div>
                        <div><strong>Interest:</strong> {formatAmount(emi12.interest)} (1% monthly)</div>
                      </div>
                    </div>

                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      <button 
                        style={{padding:'8px 12px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:4,fontSize:'12px',cursor:'pointer'}}
                        onClick={() => initiateRazorpayPayment(request, emi12.emi)}
                      >
                        Pay EMI
                      </button>
                      <button 
                        style={{padding:'8px 12px',background:'#f8f9fa',border:'1px solid #dee2e6',borderRadius:4,fontSize:'12px',cursor:'pointer'}}
                        onClick={() => setSelectedRequest(request._id)}
                      >
                        View History
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* EMI History Modal */}
            {selectedRequest && (
              <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
                <div style={{background:'#fff',borderRadius:8,padding:20,maxWidth:600,width:'90%',maxHeight:'80vh',overflow:'auto'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
                    <h3 style={{margin:0,color:'#212529'}}>EMI Payment History</h3>
                    <button 
                      style={{background:'none',border:'none',fontSize:'20px',cursor:'pointer',color:'#6c757d'}}
                      onClick={() => setSelectedRequest(null)}
                    >
                      ×
                    </button>
                  </div>

                  {emiHistory[selectedRequest] && (
                    <div>
                      <div style={{marginBottom:20,padding:15,background:'#f8f9fa',borderRadius:6}}>
                        <h4 style={{margin:0,marginBottom:10}}>Summary</h4>
                        <div style={{fontSize:'14px'}}>
                          <div><strong>Application:</strong> {emiHistory[selectedRequest].application?.ApplicationNo}</div>
                          <div><strong>Patient:</strong> {emiHistory[selectedRequest].application?.patientname}</div>
                          <div><strong>Total Payments:</strong> {emiHistory[selectedRequest].totalPayments}</div>
                          <div><strong>Total Paid:</strong> {formatAmount(emiHistory[selectedRequest].totalPaid)}</div>
                        </div>
                      </div>

                      {emiHistory[selectedRequest].emiPayments?.length > 0 ? (
                        <div>
                          <h4 style={{marginBottom:10}}>Payment Records</h4>
                          {emiHistory[selectedRequest].emiPayments.map((payment) => (
                            <div key={payment._id} style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 80px',gap:10,padding:10,border:'1px solid #e9ecef',borderRadius:4,marginBottom:8,fontSize:'13px',alignItems:'center'}}>
                              <div>
                                <div><strong>₹{payment.emiAmount.toLocaleString()}</strong></div>
                                <div style={{color:'#6c757d',fontSize:'11px'}}>Payment ID: {payment.paymentId}</div>
                              </div>
                              <div>
                                <div>Paid: {formatDate(payment.paidDate)}</div>
                                <div style={{color:'#6c757d',fontSize:'11px'}}>Due: {formatDate(payment.dueDate)}</div>
                              </div>
                              <div>
                                <div>Month: {payment.currentMonth}</div>
                                <div style={{color:'#6c757d',fontSize:'11px'}}>of {payment.totalMonths}</div>
                              </div>
                              <span style={{
                                padding:'2px 6px',
                                borderRadius:8,
                                fontSize:'10px',
                                fontWeight:'500',
                                color:'white',
                                background: payment.status === 'successful' ? '#28a745' : '#dc3545'
                              }}>
                                {payment.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{textAlign:'center',color:'#6c757d',margin:20}}>No EMI payments found</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Information Section */}
            <div style={{marginTop:30,padding:20,background:'#e7f3ff',borderRadius:8,border:'1px solid #b3d9ff'}}>
              <h4 style={{margin:0,marginBottom:15,color:'#0066cc'}}>💡 EMI Information</h4>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:15,fontSize:'13px',color:'#004499'}}>
                <div>
                  <strong>Interest Rate:</strong><br />
                  1% per month (12% annually)
                </div>
                <div>
                  <strong>Payment Method:</strong><br />
                  Secure online payment via Razorpay
                </div>
                <div>
                  <strong>Late Fees:</strong><br />
                  Additional charges apply for delayed payments
                </div>
                <div>
                  <strong>Support:</strong><br />
                  Contact our support team for any payment issues
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
