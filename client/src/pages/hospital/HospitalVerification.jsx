import React, { useState, useEffect } from 'react';
import hospitalService from '../../services/hospitalService';
import authService from '../../services/authService';
import Loader from '../../components/Loader';
import './HospitalPages.css';
import './HospitalVerification.css';

export default function HospitalVerification() {
  const [verificationData, setVerificationData] = useState({
    institutionName: '',
    hospitalAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    hospitalLicenseNumber: '',
    contactPerson: '',
    contactEmail: '',
    website: '',
    emergencyServices: []
  });
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const user = authService.getUser();

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const res = await hospitalService.getVerificationStatus();
      if (res.hospital) {
        setVerificationStatus(res.hospital.verificationStatus);
        setVerificationData({
          institutionName: res.hospital.institutionName || '',
          hospitalAddress: res.hospital.hospitalAddress || {
            street: '',
            city: '',
            state: '',
            pincode: '',
            country: 'India'
          },
          hospitalLicenseNumber: res.hospital.hospitalLicenseNumber || '',
          contactPerson: res.hospital.contactPerson || '',
          contactEmail: res.hospital.contactEmail || '',
          website: res.hospital.website || '',
          emergencyServices: res.hospital.emergencyServices || []
        });
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('hospitalAddress.')) {
      const field = name.split('.')[1];
      setVerificationData({
        ...verificationData,
        hospitalAddress: {
          ...verificationData.hospitalAddress,
          [field]: value
        }
      });
    } else {
      setVerificationData({
        ...verificationData,
        [name]: value
      });
    }
  };

  const handleServiceChange = (service) => {
    const services = verificationData.emergencyServices.includes(service)
      ? verificationData.emergencyServices.filter(s => s !== service)
      : [...verificationData.emergencyServices, service];
    
    setVerificationData({
      ...verificationData,
      emergencyServices: services
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setDocuments([...documents, ...files]);
  };

  const handleFileRemove = (index) => {
    setDocuments(documents.filter((_, i) => index !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      
      // Add verification data
      formData.append('verificationData', JSON.stringify(verificationData));
      
      // Add documents
      documents.forEach((file, index) => {
        formData.append('documents', file);
      });

      const res = await hospitalService.submitVerification(formData);
      setMessage('Verification request submitted successfully! Please wait for admin approval.');
      setVerificationStatus('pending');
      
      setTimeout(() => {
        setMessage('');
        fetchVerificationStatus();
      }, 3000);
      
    } catch (err) {
      setError(err.message || 'Failed to submit verification request');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="status-badge status-verified">✅ Verified</span>;
      case 'pending':
        return <span className="status-badge status-pending">⏳ Pending Review</span>;
      case 'rejected':
        return <span className="status-badge status-rejected">❌ Rejected</span>;
      default:
        return <span className="status-badge status-unverified">⚠️ Unverified</span>;
    }
  };

  if (verificationStatus === 'verified') {
    return (
      <div className="hospital-page-container">
        <div className="verification-success">
          <div className="success-icon">✅</div>
          <h2>Hospital Verified Successfully!</h2>
          <p>Your hospital is now verified and available for patient emergency requests.</p>
          {getStatusBadge('verified')}
          <div className="verification-details">
            <h3>Verified Information:</h3>
            <div className="detail-row">
              <span>Hospital Name:</span>
              <span>{verificationData.institutionName}</span>
            </div>
            <div className="detail-row">
              <span>License Number:</span>
              <span>{verificationData.hospitalLicenseNumber}</span>
            </div>
            <div className="detail-row">
              <span>Contact Person:</span>
              <span>{verificationData.contactPerson}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (verificationStatus === 'pending') {
    return (
      <div className="hospital-page-container">
        <div className="verification-pending">
          <div className="pending-icon">⏳</div>
          <h2>Verification Under Review</h2>
          <p>Your verification request has been submitted and is currently under admin review.</p>
          {getStatusBadge('pending')}
          <p className="review-note">You will be notified once the verification process is complete.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hospital-page-container">
      <div className="hospital-page-header">
        <h2>Hospital Verification</h2>
        <p>Complete your hospital verification to allow patients to find and submit emergency requests</p>
        {verificationStatus && getStatusBadge(verificationStatus)}
      </div>

      {message && (
        <div className="alert alert-success">
          {message}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="verification-form">
        <div className="form-section">
          <h3>Hospital Information</h3>
          
          <div className="form-group">
            <label className="form-label">Hospital Name *</label>
            <input
              type="text"
              name="institutionName"
              value={verificationData.institutionName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter hospital name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Contact Person *</label>
              <input
                type="text"
                name="contactPerson"
                value={verificationData.contactPerson}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Hospital administrator name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Email *</label>
              <input
                type="email"
                name="contactEmail"
                value={verificationData.contactEmail}
                onChange={handleInputChange}
                className="form-input"
                placeholder="hospital@example.com"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hospital License Number *</label>
              <input
                type="text"
                name="hospitalLicenseNumber"
                value={verificationData.hospitalLicenseNumber}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter license/registration number"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website</label>
              <input
                type="url"
                name="website"
                value={verificationData.website}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://hospital-website.com"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Hospital Address</h3>
          
          <div className="form-group">
            <label className="form-label">Street Address *</label>
            <input
              type="text"
              name="hospitalAddress.street"
              value={verificationData.hospitalAddress.street}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter complete street address"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                name="hospitalAddress.city"
                value={verificationData.hospitalAddress.city}
                onChange={handleInputChange}
                className="form-input"
                placeholder="City"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">State *</label>
              <input
                type="text"
                name="hospitalAddress.state"
                value={verificationData.hospitalAddress.state}
                onChange={handleInputChange}
                className="form-input"
                placeholder="State"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pincode *</label>
              <input
                type="text"
                name="hospitalAddress.pincode"
                value={verificationData.hospitalAddress.pincode}
                onChange={handleInputChange}
                className="form-input"
                placeholder="000000"
                pattern="[0-9]{6}"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Emergency Services Available</h3>
          <div className="services-grid">
            {['cardiac', 'trauma', 'pediatric', 'neurology', 'icu', 'surgery', 'other'].map(service => (
              <label key={service} className="service-checkbox">
                <input
                  type="checkbox"
                  checked={verificationData.emergencyServices.includes(service)}
                  onChange={() => handleServiceChange(service)}
                />
                <span>{service.charAt(0).toUpperCase() + service.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>Upload Verification Documents</h3>
          <p className="form-help">Upload hospital license, registration certificate, and address proof</p>
          
          <div className="file-upload-area">
            <input
              type="file"
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="file-input"
              id="documents"
            />
            <label htmlFor="documents" className="file-upload-label">
              📎 Choose Documents
            </label>
            <p className="file-help">Accepted: PDF, JPG, PNG, DOC, DOCX (Max 5MB each)</p>
          </div>

          {documents.length > 0 && (
            <div className="selected-files">
              <h4>Selected Documents:</h4>
              {documents.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-name">📄 {file.name}</span>
                  <button
                    type="button"
                    onClick={() => handleFileRemove(index)}
                    className="file-remove"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || documents.length === 0}
          >
            {loading ? <Loader /> : 'Submit for Verification'}
          </button>
        </div>
      </form>
    </div>
  );
}