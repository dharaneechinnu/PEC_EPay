import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import patientService from '../../services/patientService';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [showRequestsList, setShowRequestsList] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEMISection, setShowEMISection] = useState(false);
  const [fundedRequests, setFundedRequests] = useState([]);
  const [selectedRequestForEMI, setSelectedRequestForEMI] = useState(null);
  const [emiDetails, setEmiDetails] = useState(null);
  const [emiLoading, setEmiLoading] = useState(false);

  // Check if Razorpay SDK is loaded
  useEffect(() => {
    const checkRazorpay = () => {
      if (typeof window.Razorpay === 'undefined') {
        console.warn('Razorpay SDK not loaded, retrying...');
        setTimeout(checkRazorpay, 1000);
      } else {
        console.log('Razorpay SDK loaded successfully');
      }
    };
    checkRazorpay();
  }, []);

  const handleViewRequests = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        setError('User not found. Please login again.');
        return;
      }
      
      const user = JSON.parse(userString);
      const patientemail = user.email;
      
      setLoading(true);
      setError(null);
      
      const response = await patientService.getMyRequests(patientemail);
      setRequests(response.applications || []);
      setShowRequestsList(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f39c12';
      case 'submitted': return '#3498db';
      case 'approved': return '#27ae60';
      case 'funded': return '#2ecc71';
      case 'disbursed': return '#16a085';
      case 'rejected': return '#e74c3c';
      case 'expired': return '#95a5a6';
      default: return '#7f8c8d';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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

  const handleViewEMIOptions = async () => {
    try {
      const userString = localStorage.getItem('user');
      if (!userString) {
        setError('User not found. Please login again.');
        return;
      }
      
      const user = JSON.parse(userString);
      const patientemail = user.email;
      
      setEmiLoading(true);
      setError(null);
      
      const response = await patientService.getMyRequests(patientemail);
      const allRequests = response.applications || [];
      
      // Filter only funded/disbursed requests that need EMI
      const funded = allRequests.filter(req => 
        ['funded', 'disbursed'].includes(req.status?.toLowerCase()) && 
        req.approvedAmount > 0
      );
      
      setFundedRequests(funded);
      setShowEMISection(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch funded requests');
    } finally {
      setEmiLoading(false);
    }
  };

  const generateEMIPDF = async (request, emiData) => {
    try {
      const response = await fetch('http://localhost:3500/patient/generate-emi-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          requestId: request._id,
          applicationNo: request.ApplicationNo,
          patientName: request.patientname,
          emiData
        })
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EMI_Schedule_${request.ApplicationNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to generate PDF: ' + err.message);
    }
  };

  const initiateRazorpayPayment = async (request, emiAmount) => {
    try {
      setError(null);
      
      // Validate required data
      if (!request._id || !emiAmount || emiAmount <= 0) {
        throw new Error('Invalid payment data');
      }

      // First create payment order using patientService
      console.log('Creating payment order for:', { requestId: request._id, amount: emiAmount });
      
      const orderData = await patientService.createEMIPaymentOrder(request._id, emiAmount);
      console.log('Order response:', orderData);

      console.log('Payment order created successfully:', orderData);

      // Validate order data
      if (!orderData || !orderData.orderId) {
        console.error('Invalid order response - missing orderId:', orderData);
        throw new Error('Invalid order response - missing order ID');
      }

      // Additional validation
      if (!orderData.amount || orderData.amount <= 0) {
        console.error('Invalid order amount:', orderData.amount);
        throw new Error('Invalid order amount received');
      }

      // Verify Razorpay is loaded
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }

      const options = {
        key: 'rzp_test_epPmzNozAIcJcC',
        amount: orderData.amount || (emiAmount * 100),
        currency: orderData.currency || 'INR',
        order_id: orderData.orderId, // Make sure this field is correct
        name: 'Medical Emergency Fund',
        description: `EMI Payment for ${request.ApplicationNo || 'Medical Request'}`,
        image: '/logo192.png',
        handler: async (response) => {
          try {
            console.log('Razorpay payment successful:', response);
            console.log('Payment response keys:', Object.keys(response));
            
            // Extract payment details with fallback for different field names
            const extractedOrderId = response.razorpay_order_id || response.order_id || orderData.orderId;
            const extractedPaymentId = response.razorpay_payment_id || response.payment_id;
            const extractedSignature = response.razorpay_signature || response.signature;
            
            if (!extractedOrderId) {
              console.error('❌ No order ID found in response:', response);
              throw new Error('Order ID not found in payment response');
            }
            
            if (!extractedPaymentId) {
              console.error('❌ No payment ID found in response:', response);
              throw new Error('Payment ID not found in payment response');
            }
            
            if (!extractedSignature) {
              console.error('❌ No signature found in response:', response);
              throw new Error('Payment signature not found in response');
            }
            
            // Extract payment details
            const paymentDetails = {
              requestId: request._id,
              paymentId: extractedPaymentId,
              orderId: extractedOrderId,
              signature: extractedSignature,
              amount: emiAmount,
              patientEmail: request.studentemail || request.patientemail || ''
            };
            
            console.log('Sending verification request:', paymentDetails);
            
            // Verify payment on backend using patientService
            const verifyData = await patientService.verifyEMIPayment(paymentDetails);
            console.log('Verification response:', verifyData);

            alert(`✅ EMI payment successful!\n\nPayment ID: ${response.razorpay_payment_id}\nAmount: ₹${emiAmount.toLocaleString()}`);
            
            // Refresh the requests to show updated status
            if (showRequestsList) {
              handleViewRequests();
            }
            if (showEMISection) {
              handleViewEMIOptions();
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            alert(`❌ Payment verification failed: ${err.message}\n\nPlease contact support if money was deducted.`);
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed by user');
          }
        },
        prefill: {
          name: request.patientname || request.studentname || 'Patient',
          email: request.patientemail || request.studentemail || '',
          contact: request.patientphone || request.phone || ''
        },
        notes: {
          requestId: request._id,
          applicationNo: request.ApplicationNo,
          medicalCondition: request.medicalCondition
        },
        theme: {
          color: '#00a2ff'
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 300, // 5 minutes
        remember_customer: false
      };

      console.log('Opening Razorpay with options:', options);
      
      const rzp = new window.Razorpay(options);
      
      // Add error handler for Razorpay
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert(`❌ Payment Failed!\n\nReason: ${response.error.description}\nCode: ${response.error.code}`);
      });

      rzp.open();
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      setError(`Failed to initiate payment: ${error.message}`);
    }
  };

  return (
    <div style={{minHeight:'100vh',padding:40,background:'#f4faff'}}>
      <div style={{maxWidth:1000,margin:'0 auto',background:'#fff',border:'1px solid #dceeff',borderRadius:12,padding:30}}>
        <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,borderBottom:'1px solid #e8f4ff',paddingBottom:12}}>
          <h1 style={{margin:0,color:'#00a2ff'}}>Patient Dashboard</h1>
          <button style={{padding:'8px 12px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}} onClick={async () => { await authService.logout(); navigate('/login'); }}>{token ? 'Logout' : 'Login'}</button>
        </header>

        <section>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:20}}>
            <div style={{border:'1px solid #bde0ff',padding:16,borderRadius:10}}>
              <h3 style={{color:'#00a2ff'}}>Create Funding Request</h3>
              <p>Submit a new funding request with documents (FIR for accidents, medical reports).</p>
              <button style={{padding:'8px 12px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}} onClick={()=>navigate('/patient/create-request')}>Create Request</button>
            </div>

            <div style={{border:'1px solid #bde0ff',padding:16,borderRadius:10}}>
              <h3 style={{color:'#00a2ff'}}>View My Requests</h3>
              <p>See status of your emergency funding requests, approval decisions and payouts.</p>
              <button 
                style={{padding:'8px 12px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}} 
                onClick={handleViewRequests}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'View Requests'}
              </button>
            </div>

            <div style={{border:'1px solid #bde0ff',padding:16,borderRadius:10}}>
              <h3 style={{color:'#00a2ff'}}>EMI Repayment</h3>
              <p>Manage monthly installments for your funded medical emergency amounts (1% monthly interest).</p>
              <div style={{display:'flex',gap:8}}>
                <button 
                  style={{padding:'8px 12px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:8,cursor:'pointer'}} 
                  onClick={handleViewEMIOptions}
                  disabled={emiLoading}
                >
                  {emiLoading ? 'Loading...' : 'Quick EMI View'}
                </button>
                <button 
                  style={{padding:'8px 12px',background:'#f8f9fa',border:'1px solid #dee2e6',borderRadius:8,cursor:'pointer'}} 
                  onClick={() => navigate('/patient/repayment')}
                >
                  Full EMI Center
                </button>
              </div>
            </div>

            <div style={{border:'1px solid #bde0ff',padding:16,borderRadius:10}}>
              <h3 style={{color:'#00a2ff'}}>Check Request Status</h3>
              <p>Provide your request ID to check approval and payout status quickly.</p>
              <RequestStatusChecker />
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div style={{marginTop:20,padding:15,background:'#ffeaea',border:'1px solid #ffcccb',borderRadius:8,color:'#d8000c'}}>
            {error}
          </div>
        )}

        {/* My Requests List */}
        {showRequestsList && (
          <section style={{marginTop:30}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{color:'#00a2ff',margin:0}}>My Funding Requests</h2>
              <button 
                style={{padding:'6px 12px',background:'#f8f9fa',border:'1px solid #dee2e6',borderRadius:6,cursor:'pointer'}}
                onClick={() => setShowRequestsList(false)}
              >
                Close
              </button>
            </div>
            
            {requests.length === 0 ? (
              <div style={{textAlign:'center',padding:40,background:'#f8f9fa',borderRadius:8}}>
                <p style={{color:'#6c757d',margin:0}}>No funding requests found</p>
              </div>
            ) : (
              <div style={{background:'#fff',border:'1px solid #dee2e6',borderRadius:8,overflow:'hidden'}}>
                <div style={{display:'grid',gridTemplateColumns:'150px 1fr 120px 120px 100px 150px',gap:10,padding:'15px 20px',background:'#f8f9fa',fontWeight:'600',borderBottom:'1px solid #dee2e6',fontSize:'14px'}}>
                  <div>Request ID</div>
                  <div>Medical Condition</div>
                  <div>Requested</div>
                  <div>Approved</div>
                  <div>Status</div>
                  <div>Date</div>
                </div>
                
                {requests.map((request, index) => (
                  <div 
                    key={request._id} 
                    style={{
                      display:'grid',
                      gridTemplateColumns:'150px 1fr 120px 120px 100px 150px',
                      gap:10,
                      padding:'15px 20px',
                      borderBottom: index < requests.length - 1 ? '1px solid #f1f1f1' : 'none',
                      fontSize:'13px',
                      alignItems:'center'
                    }}
                  >
                    <div style={{fontFamily:'monospace',fontSize:'12px',color:'#495057'}}>
                      {request.ApplicationNo || 'N/A'}
                    </div>
                    <div>
                      <div style={{fontWeight:'500',color:'#212529',marginBottom:2}}>
                        {request.medicalCondition || 'N/A'}
                      </div>
                      <div style={{fontSize:'11px',color:'#6c757d'}}>
                        {request.emergencyType ? request.emergencyType.charAt(0).toUpperCase() + request.emergencyType.slice(1) : ''}
                        {request.urgencyLevel && ` • ${request.urgencyLevel.charAt(0).toUpperCase() + request.urgencyLevel.slice(1)}`}
                      </div>
                    </div>
                    <div style={{fontWeight:'500',color:'#495057'}}>
                      {request.requestedAmount ? formatAmount(request.requestedAmount) : 'N/A'}
                    </div>
                    <div style={{fontWeight:'500',color:'#495057'}}>
                      {request.approvedAmount ? formatAmount(request.approvedAmount) : '-'}
                    </div>
                    <div>
                      <span style={{
                        padding:'4px 8px',
                        borderRadius:12,
                        fontSize:'11px',
                        fontWeight:'500',
                        color:'white',
                        background:getStatusColor(request.status)
                      }}>
                        {request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Unknown'}
                      </span>
                    </div>
                    <div style={{color:'#6c757d'}}>
                      {request.createdAt ? formatDate(request.createdAt) : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {requests.length > 0 && (
              <div style={{marginTop:15,padding:15,background:'#f8f9fa',borderRadius:8}}>
                <h4 style={{margin:0,marginBottom:10,color:'#495057',fontSize:'14px'}}>Status Meanings:</h4>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:10,fontSize:'12px'}}>
                  <div><span style={{color:'#3498db',fontWeight:'500'}}>Submitted:</span> Request received</div>
                  <div><span style={{color:'#f39c12',fontWeight:'500'}}>Pending:</span> Under review</div>
                  <div><span style={{color:'#27ae60',fontWeight:'500'}}>Approved:</span> Request approved</div>
                  <div><span style={{color:'#2ecc71',fontWeight:'500'}}>Funded:</span> Funds allocated</div>
                  <div><span style={{color:'#16a085',fontWeight:'500'}}>Disbursed:</span> Amount transferred</div>
                  <div><span style={{color:'#e74c3c',fontWeight:'500'}}>Rejected:</span> Request declined</div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* EMI Section */}
        {showEMISection && (
          <section style={{marginTop:30}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h2 style={{color:'#00a2ff',margin:0}}>EMI Repayment Options</h2>
              <button 
                style={{padding:'6px 12px',background:'#f8f9fa',border:'1px solid #dee2e6',borderRadius:6,cursor:'pointer'}}
                onClick={() => setShowEMISection(false)}
              >
                Close
              </button>
            </div>
            
            {fundedRequests.length === 0 ? (
              <div style={{textAlign:'center',padding:40,background:'#f8f9fa',borderRadius:8}}>
                <p style={{color:'#6c757d',margin:0}}>No funded requests available for EMI</p>
                <p style={{color:'#6c757d',margin:0,fontSize:'14px'}}>EMI options are available only for funded or disbursed requests</p>
              </div>
            ) : (
              <div>
                {fundedRequests.map((request) => {
                  const emi6 = calculateEMI(request.approvedAmount, 6);
                  const emi12 = calculateEMI(request.approvedAmount, 12);
                  const emi24 = calculateEMI(request.approvedAmount, 24);
                  
                  return (
                    <div key={request._id} style={{background:'#fff',border:'1px solid #dee2e6',borderRadius:8,padding:20,marginBottom:20}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:15}}>
                        <div>
                          <h4 style={{margin:0,color:'#212529'}}>Request: {request.ApplicationNo}</h4>
                          <p style={{margin:'5px 0',color:'#6c757d',fontSize:'14px'}}>
                            {request.medicalCondition} • Approved Amount: {formatAmount(request.approvedAmount)}
                          </p>
                        </div>
                        <span style={{
                          padding:'4px 8px',
                          borderRadius:12,
                          fontSize:'11px',
                          fontWeight:'500',
                          color:'white',
                          background:getStatusColor(request.status)
                        }}>
                          {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                        </span>
                      </div>

                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:15}}>
                        {/* 6 Months EMI */}
                        <div style={{border:'1px solid #e9ecef',borderRadius:8,padding:15}}>
                          <h5 style={{margin:0,marginBottom:10,color:'#495057'}}>6 Months Plan</h5>
                          <div style={{fontSize:'14px',lineHeight:1.4}}>
                            <div><strong>EMI:</strong> {formatAmount(emi6.emi)}/month</div>
                            <div><strong>Total:</strong> {formatAmount(emi6.totalAmount)}</div>
                            <div><strong>Interest:</strong> {formatAmount(emi6.interest)}</div>
                          </div>
                          <div style={{marginTop:10,display:'flex',gap:5}}>
                            <button 
                              style={{flex:1,padding:'6px 10px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:4,fontSize:'12px',cursor:'pointer'}}
                              onClick={() => initiateRazorpayPayment(request, emi6.emi)}
                            >
                              Pay ₹{emi6.emi.toLocaleString()}
                            </button>
                            <button 
                              style={{flex:1,padding:'6px 10px',background:'#f8f9fa',border:'1px solid #dee2e6',borderRadius:4,fontSize:'12px',cursor:'pointer'}}
                              onClick={() => generateEMIPDF(request, emi6)}
                            >
                              Get PDF
                            </button>
                          </div>
                        </div>

                        {/* 12 Months EMI */}
                        <div style={{border:'1px solid #e9ecef',borderRadius:8,padding:15}}>
                          <h5 style={{margin:0,marginBottom:10,color:'#495057'}}>12 Months Plan</h5>
                          <div style={{fontSize:'14px',lineHeight:1.4}}>
                            <div><strong>EMI:</strong> {formatAmount(emi12.emi)}/month</div>
                            <div><strong>Total:</strong> {formatAmount(emi12.totalAmount)}</div>
                            <div><strong>Interest:</strong> {formatAmount(emi12.interest)}</div>
                          </div>
                          <div style={{marginTop:10,display:'flex',gap:5}}>
                            <button 
                              style={{flex:1,padding:'6px 10px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:4,fontSize:'12px',cursor:'pointer'}}
                              onClick={() => initiateRazorpayPayment(request, emi12.emi)}
                            >
                              Pay ₹{emi12.emi.toLocaleString()}
                            </button>
                            <button 
                              style={{flex:1,padding:'6px 10px',background:'#f8f9fa',border:'1px solid #dee2e6',borderRadius:4,fontSize:'12px',cursor:'pointer'}}
                              onClick={() => generateEMIPDF(request, emi12)}
                            >
                              Get PDF
                            </button>
                          </div>
                        </div>

                        {/* 24 Months EMI */}
                        <div style={{border:'1px solid #e9ecef',borderRadius:8,padding:15}}>
                          <h5 style={{margin:0,marginBottom:10,color:'#495057'}}>24 Months Plan</h5>
                          <div style={{fontSize:'14px',lineHeight:1.4}}>
                            <div><strong>EMI:</strong> {formatAmount(emi24.emi)}/month</div>
                            <div><strong>Total:</strong> {formatAmount(emi24.totalAmount)}</div>
                            <div><strong>Interest:</strong> {formatAmount(emi24.interest)}</div>
                          </div>
                          <div style={{marginTop:10,display:'flex',gap:5}}>
                            <button 
                              style={{flex:1,padding:'6px 10px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:4,fontSize:'12px',cursor:'pointer'}}
                              onClick={() => initiateRazorpayPayment(request, emi24.emi)}
                            >
                              Pay ₹{emi24.emi.toLocaleString()}
                            </button>
                            <button 
                              style={{flex:1,padding:'6px 10px',background:'#f8f9fa',border:'1px solid #dee2e6',borderRadius:4,fontSize:'12px',cursor:'pointer'}}
                              onClick={() => generateEMIPDF(request, emi24)}
                            >
                              Get PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div style={{marginTop:15,padding:15,background:'#e7f3ff',borderRadius:8,border:'1px solid #b3d9ff'}}>
                  <h4 style={{margin:0,marginBottom:10,color:'#0066cc',fontSize:'14px'}}>📝 EMI Information:</h4>
                  <div style={{fontSize:'13px',color:'#004499',lineHeight:1.5}}>
                    <div>• <strong>Interest Rate:</strong> 1% per month (12% annually)</div>
                    <div>• <strong>Payment Method:</strong> Secure online payment via Razorpay</div>
                    <div>• <strong>PDF Schedule:</strong> Download detailed EMI schedule with payment dates</div>
                    <div>• <strong>Late Fees:</strong> Additional charges apply for delayed payments</div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

const RequestStatusChecker = () => {
  const [id, setId] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const check = async () => {
    if (!id) return setResult({ error: 'Please provide a request ID' });
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`http://localhost:3500/patient/requeststatus/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) return setResult({ error: data.message || 'Unable to fetch' });
      setResult({ success: data });
    } catch (err) { setResult({ error: err.message }); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <input value={id} onChange={(e)=>setId(e.target.value)} placeholder="Request ID (e.g. EMC-123)" style={{width:'100%',padding:10,border:'1px solid #bde0ff',borderRadius:8,marginBottom:8}} />
      <button onClick={check} disabled={loading} style={{padding:'8px 12px',background:'#00a2ff',color:'#fff',border:'none',borderRadius:8}}> {loading ? 'Checking...' : 'Check Status'}</button>

      {result && (
        <div style={{marginTop:12,padding:10,background:'#f4faff',border:'1px solid #bde0ff',borderRadius:8}}>
          {result.error ? (
            <div style={{color:'#ff4d4f'}}>{result.error}</div>
          ) : (
            <div>
              <div><strong>Request ID:</strong> {result.success.requestId}</div>
              <div><strong>Status:</strong> {result.success.status}</div>
              <div><strong>Payout Status:</strong> {result.success.payoutStatus}</div>
              {result.success.application?.approvedAmount && (
                <div><strong>Approved Amount:</strong> ₹{result.success.application.approvedAmount.toLocaleString()}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
