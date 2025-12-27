import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import patientService from '../../services/patientService';
import hospitalService from '../../services/hospitalService';
import authService from '../../services/authService';
import Loader from '../../components/Loader';
import '../hospital/HospitalPages.css';
import '../admin/AdminPages.css';

export default function CreateRequest() {
  const navigate = useNavigate();
  const user = authService.getUser();
  const [scholarships, setScholarships] = useState([]);
  const [verifiedHospitals, setVerifiedHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const searchTimer = useRef(null);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [form, setForm] = useState({
    scholarshipId: '',
    patientname: user?.name || '',
    patientemail: user?.email || '',
    gender: '',
    emergencyType: '',
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
    // populate an initial small list
    fetchVerifiedHospitals('');
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

  // search verified hospitals (server-side) by query
  const fetchVerifiedHospitals = async (q = '') => {
    try {
      const res = await hospitalService.getVerifiedHospitals(q, { limit: 50 });
      setVerifiedHospitals(res.hospitals || []);
    } catch (err) {
      console.error('Failed to load verified hospitals:', err);
      setError('Failed to load verified hospitals. Please try again later.');
    }
  };

  // For server-side search we display the list returned by backend
  const filteredHospitals = verifiedHospitals;

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

    // Validate hospital selection — require selected hospital id from autocomplete
    if (!selectedHospitalId) {
      setError('Please select a verified hospital from the dropdown');
      setLoading(false);
      return;
    }

    try {
      const selectedScholarship = (scholarships || []).find(s => s._id === form.scholarshipId);
      
      const payload = {
        scholarshipId: form.scholarshipId,
        patientname: form.patientname,
        patientemail: form.patientemail,
        emergencyType: form.emergencyType,
        gender: form.gender,
        institutionname: form.hospitalName || form.institutionname,
        hospitalName: form.hospitalName,
        hospitalId: selectedHospitalId,
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
          patientname: user?.name || '',
          patientemail: user?.email || '',
          gender: '',
          emergencyType: '',
          institutionname: '',
          classoryear: '',
          familyIncome: '',
          requestedAmount: '',
          hospitalName: '',
          hospitalId: '',
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
        setSelectedHospitalId('');
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

    // Add document metadata - specify Document for accidents, other for regular documents
    const docMeta = selectedFiles.map((file, index) => {
      const fileName = file.name.toLowerCase();
      let docType = 'Document';
      if (form.isAccident && (fileName.includes('fir') || fileName.includes('document'))) {
        docType = 'Document';
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
            Submit a funding request with required documents (Document for accidents)
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
            <h3 className="form-section-title">Patient Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Patient Name *</label>
                <input
                  type="text"
                  name="patientname"
                  value={form.patientname}
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
                  name="patientemail"
                  value={form.patientemail}
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
                <label className="form-label">Emergency Type *</label>
                <select
                  name="emergencyType"
                  value={form.emergencyType}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">-- Select emergency type --</option>
                  <option value="cardiac">Cardiac</option>
                  <option value="trauma">Trauma</option>
                  <option value="surgery">Surgery</option>
                  <option value="icu">ICU</option>
                  <option value="cancer">Cancer</option>
                  <option value="neurological">Neurological</option>
                  <option value="pediatric">Pediatric</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Hospital Name *</label>
                {verifiedHospitals.length === 0 ? (
                  <div className="hospital-unavailable">
                    <div className="alert alert-warning">
                      ⚠️ No verified hospitals are currently available. Please contact admin for hospital verification.
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="No verified hospitals available"
                      disabled
                      style={{ cursor: 'not-allowed', opacity: 0.6 }}
                    />
                  </div>
                ) : (
                  <div className="hospital-selector">
                    <div className="hospital-search-wrapper">
                      <input
                        type="text"
                        value={hospitalSearch}
                        onChange={(e) => {
                          const v = e.target.value;
                          setHospitalSearch(v);
                          setShowHospitalDropdown(true);
                          if (searchTimer.current) clearTimeout(searchTimer.current);
                          searchTimer.current = setTimeout(() => fetchVerifiedHospitals(v), 300);
                        }}
                        onFocus={() => {
                          setShowHospitalDropdown(true);
                          if (!hospitalSearch) fetchVerifiedHospitals('');
                        }}
                        className="form-input"
                        placeholder="Search for verified hospital..."
                        required
                      />
                      {showHospitalDropdown && filteredHospitals.length > 0 && (
                        <div className="hospital-dropdown">
                          {filteredHospitals.map((hospital) => (
                            <div
                              key={hospital._id}
                              className="hospital-option"
                              onClick={() => {
                                setForm({ ...form, hospitalName: hospital.institutionName });
                                setSelectedHospitalId(hospital._id);
                                setHospitalSearch(hospital.institutionName);
                                setShowHospitalDropdown(false);
                              }}
                            >
                              <div className="hospital-name">{hospital.institutionName}</div>
                              {hospital.hospitalAddress && (
                                <div className="hospital-address">
                                  📍 {hospital.hospitalAddress.city}, {hospital.hospitalAddress.state}
                                </div>
                              )}
                              {hospital.emergencyServices && hospital.emergencyServices.length > 0 && (
                                <div className="hospital-services">
                                  🏥 {hospital.emergencyServices.slice(0, 3).map(service => 
                                    service.charAt(0).toUpperCase() + service.slice(1)
                                  ).join(', ')}
                                  {hospital.emergencyServices.length > 3 && ' ...'}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {hospitalSearch && !filteredHospitals.some(h => h.institutionName === hospitalSearch) && (
                      <div className="hospital-warning">
                        ⚠️ Please select from verified hospitals only
                      </div>
                    )}
                  </div>
                )}
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
                <span>This is an accident case (Document required)</span>
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
                Documents {form.isAccident && '(Document Required for Accidents)'}
              </h3>
            
            <div
              className="file-upload-area"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="file-upload-icon">📄</div>
              <div className="file-upload-text">Drop documents here or click to upload</div>
              <div className="file-upload-hint">Medical Documents, Reports, Accident Proof (PDF, JPG, PNG - Max 5MB each)</div>
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
                ⚠️ Please upload Document for accident cases
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

