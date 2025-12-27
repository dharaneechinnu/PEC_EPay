import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import authService from '../../services/authService';
import Loader from '../../components/Loader';
import '../hospital/HospitalPages.css';
import '../admin/AdminPages.css';

export default function CreateRequest() {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [scholarships, setScholarships] = useState([]);
  const [form, setForm] = useState({
    scholarshipId: '',
    studentname: user?.name || '',
    studentemail: user?.email || '',
    gender: '',
    institutionname: '',
    classoryear: '',
    familyIncome: '',
    requestedAmount: '',
    hospitalName: '',
    isAccident: false,
    remarks: '',
    payoutDetails: {
      accountHolderName: '',
      accountNumber: '',
      ifsc: '',
      bankName: '',
      email: '',
      phone: '',
    },
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingScholarships, setLoadingScholarships] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [createdApplicationId, setCreatedApplicationId] = useState(null);

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    setLoadingScholarships(true);
    try {
      const res = await patientService.getScholarships();
      setScholarships(res.scholarships || []);
    } catch (err) {
      setError(err.message || 'Failed to load funding programs');
    } finally {
      setLoadingScholarships(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('payoutDetails.')) {
      const field = name.split('.')[1];
      setForm({
        ...form,
        payoutDetails: {
          ...form.payoutDetails,
          [field]: value,
        },
      });
    } else {
      setForm({
        ...form,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleFileRemove = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => index !== i));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const selectedScholarship = scholarships.find(s => s._id === form.scholarshipId);
      
      const payload = {
        scholarshipId: form.scholarshipId,
        studentname: form.studentname,
        studentemail: form.studentemail,
        gender: form.gender,
        institutionname: form.hospitalName || form.institutionname,
        hospitalName: form.hospitalName,
        classoryear: form.classoryear,
        familyIncome: Number(form.familyIncome),
        requestedAmount: Number(form.requestedAmount),
        fundedraised: Number(form.requestedAmount),
        remarks: form.remarks,
        payoutDetails: {
          accountHolderName: form.payoutDetails.accountHolderName,
          accountNumber: form.payoutDetails.accountNumber,
          ifsc: form.payoutDetails.ifsc,
          bankName: form.payoutDetails.bankName,
          email: form.payoutDetails.email,
          phone: form.payoutDetails.phone,
        },
      };

      const res = await patientService.createFundingRequest(payload);
      setCreatedApplicationId(res.application?._id);
      setMessage('Request created successfully! Uploading documents...');

      // Upload documents if any
      if (selectedFiles.length > 0 && res.application?._id) {
        await uploadDocuments(res.application._id);
      } else {
        setMessage('Request created successfully! You can upload documents later.');
      }

      // Reset form after 3 seconds and redirect
      setTimeout(() => {
        setForm({
          scholarshipId: '',
          studentname: user?.name || '',
          studentemail: user?.email || '',
          gender: '',
          institutionname: '',
          classoryear: '',
          familyIncome: '',
          requestedAmount: '',
          hospitalName: '',
          isAccident: false,
          remarks: '',
          payoutDetails: {
            accountHolderName: '',
            accountNumber: '',
            ifsc: '',
            bankName: '',
            email: '',
            phone: '',
          },
        });
        setSelectedFiles([]);
        setMessage('');
        setCreatedApplicationId(null);
        navigate('/patient');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to create request');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const uploadDocuments = async (applicationId) => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('documents', file);
    });

    // Add document metadata - specify FIR for accidents, other for regular documents
    const docMeta = selectedFiles.map((file, index) => {
      const fileName = file.name.toLowerCase();
      let docType = 'Document';
      if (form.isAccident && fileName.includes('fir')) {
        docType = 'FIR';
      } else if (form.isAccident && (fileName.includes('accident') || fileName.includes('proof'))) {
        docType = 'Accident Proof';
      } else if (fileName.includes('medical')) {
        docType = 'Medical Document';
      } else if (fileName.includes('report')) {
        docType = 'Medical Report';
      }
      return { docType };
    });

    formData.append('documents', JSON.stringify(docMeta));

    try {
      await patientService.uploadDocuments(applicationId, formData);
      setMessage('Request and documents uploaded successfully!');
    } catch (err) {
      console.error('Document upload failed:', err);
      setMessage('Request created but document upload failed. You can upload documents later.');
    }
  };

  return (
    <div className="hospital-page-container admin-page-container" style={{ padding: '32px' }}>
      <div className="hospital-page-header admin-page-header">
        <div>
          <h2 className="hospital-page-heading admin-page-heading">Create Funding Request</h2>
          <p className="hospital-page-subtitle admin-page-subtitle">
            Submit a funding request with required documents (FIR for accidents)
          </p>
        </div>
      </div>

      {message && (
        <div className="alert alert-success">
          {message}
          {createdApplicationId && (
            <div style={{ marginTop: '8px', fontSize: '13px' }}>
              Application ID: {createdApplicationId}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="admin-form-container">
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">Funding Program</h3>
            
            <div className="form-group">
              <label className="form-label">Select Funding Program *</label>
              {loadingScholarships ? (
                <Loader />
              ) : (
                <select
                  name="scholarshipId"
                  value={form.scholarshipId}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">-- Select a program --</option>
                  {scholarships.map(sch => (
                    <option key={sch._id} value={sch._id}>
                      {sch.scholarshipName} - ₹{sch.scholarshipAmount?.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Patient Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Patient Name *</label>
                <input
                  type="text"
                  name="studentname"
                  value={form.studentname}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="studentemail"
                  value={form.studentemail}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gender *</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">-- Select --</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Hospital Name *</label>
                <input
                  type="text"
                  name="hospitalName"
                  value={form.hospitalName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Hospital/Institution name"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Department/Ward</label>
                <input
                  type="text"
                  name="classoryear"
                  value={form.classoryear}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g., Cardiology, ICU"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Family Income (₹) *</label>
                <input
                  type="number"
                  name="familyIncome"
                  value={form.familyIncome}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="50000"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Requested Amount (₹) *</label>
              <input
                type="number"
                name="requestedAmount"
                value={form.requestedAmount}
                onChange={handleChange}
                className="form-input"
                placeholder="100000"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="isAccident"
                  checked={form.isAccident}
                  onChange={handleChange}
                  style={{ width: 'auto' }}
                />
                <span>This is an accident case (FIR required)</span>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea
                name="remarks"
                value={form.remarks}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Additional information about your situation..."
                rows="3"
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Hospital Bank Details (for receiving payment) *</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Account Holder Name *</label>
                <input
                  type="text"
                  name="payoutDetails.accountHolderName"
                  value={form.payoutDetails.accountHolderName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Hospital account name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Number *</label>
                <input
                  type="text"
                  name="payoutDetails.accountNumber"
                  value={form.payoutDetails.accountNumber}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="1234567890"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">IFSC Code *</label>
                <input
                  type="text"
                  name="payoutDetails.ifsc"
                  value={form.payoutDetails.ifsc}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="SBIN0001234"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bank Name *</label>
                <input
                  type="text"
                  name="payoutDetails.bankName"
                  value={form.payoutDetails.bankName}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="State Bank of India"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact Email *</label>
                <input
                  type="email"
                  name="payoutDetails.email"
                  value={form.payoutDetails.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="hospital@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Phone *</label>
                <input
                  type="tel"
                  name="payoutDetails.phone"
                  value={form.payoutDetails.phone}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="+91 9876543210"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">
              Documents {form.isAccident && '(FIR Copy Required for Accidents)'}
            </h3>
            
            <div
              className="file-upload-area"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="file-upload-icon">📄</div>
              <div className="file-upload-text">
                {form.isAccident 
                  ? 'Drop FIR copy and other documents here or click to upload'
                  : 'Drop documents here or click to upload'}
              </div>
              <div className="file-upload-hint">
                {form.isAccident 
                  ? 'FIR Copy (required), Medical Reports, Accident Proof (PDF, JPG, PNG - Max 5MB each)'
                  : 'Medical Documents, Reports (PDF, JPG, PNG - Max 5MB each)'}
              </div>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-upload"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload" className="btn btn-primary" style={{ marginTop: '16px', cursor: 'pointer' }}>
                Choose Files
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="file-list">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <div className="file-item-info">
                      <div className="file-item-icon">📄</div>
                      <div className="file-item-details">
                        <div className="file-item-name">{file.name}</div>
                        <div className="file-item-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="file-item-remove"
                      onClick={() => handleFileRemove(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.isAccident && selectedFiles.length === 0 && (
              <div className="alert" style={{ background: '#fef3c7', color: '#92400e', marginTop: '16px' }}>
                ⚠️ Please upload FIR copy for accident cases
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? <Loader /> : '➕ Submit Funding Request'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-large"
              onClick={() => navigate('/patient')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

