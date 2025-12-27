import React, { useState } from 'react';
import adminService from '../../services/adminService';
import Loader from '../../components/Loader';
import './AdminPages.css';

export default function CreateFundingProgram() {
  const [form, setForm] = useState({
    name: '',
    description: '',
    amount: '',
    eligibilityCriteria: {
      tenthMarks: '',
      twelfthMarks: '',
      collegeCGPA: '',
      maxParentIncome: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('eligibility.')) {
      const field = name.split('.')[1];
      setForm({
        ...form,
        eligibilityCriteria: {
          ...form.eligibilityCriteria,
          [field]: value,
        },
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        scholarshipName: form.name,
        providerName: 'Admin', // Can be updated based on logged-in admin
        description: form.description,
        scholarshipAmount: Number(form.amount),
        applicationDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        eligibilityCriteria: {
          tenthMarks: form.eligibilityCriteria.tenthMarks ? Number(form.eligibilityCriteria.tenthMarks) : null,
          twelfthMarks: form.eligibilityCriteria.twelfthMarks ? Number(form.eligibilityCriteria.twelfthMarks) : null,
          collegeCGPA: form.eligibilityCriteria.collegeCGPA ? Number(form.eligibilityCriteria.collegeCGPA) : null,
          maxParentIncome: form.eligibilityCriteria.maxParentIncome ? Number(form.eligibilityCriteria.maxParentIncome) : null,
        },
        isActive: true,
      };

      const res = await adminService.createScholarship(payload);
      setMessage('Funding program created successfully!');
      setForm({
        name: '',
        description: '',
        amount: '',
        eligibilityCriteria: {
          tenthMarks: '',
          twelfthMarks: '',
          collegeCGPA: '',
          maxParentIncome: '',
        },
      });
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to create funding program');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-heading">Create Funding Program</h2>
          <p className="admin-page-subtitle">Set up a new scholarship or funding program</p>
        </div>
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

      <div className="admin-form-container">
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">Basic Information</h3>
            
            <div className="form-group">
              <label className="form-label">Program Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Merit Scholarship 2024"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Describe the funding program, its purpose, and benefits..."
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Scholarship Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                className="form-input"
                placeholder="50000"
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Eligibility Criteria (Optional)</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">10th Marks (%)</label>
                <input
                  type="number"
                  name="eligibility.tenthMarks"
                  value={form.eligibilityCriteria.tenthMarks}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="85"
                  min="0"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label className="form-label">12th Marks (%)</label>
                <input
                  type="number"
                  name="eligibility.twelfthMarks"
                  value={form.eligibilityCriteria.twelfthMarks}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="85"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">College CGPA</label>
                <input
                  type="number"
                  name="eligibility.collegeCGPA"
                  value={form.eligibilityCriteria.collegeCGPA}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="8.5"
                  min="0"
                  max="10"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Parent Income (₹)</label>
                <input
                  type="number"
                  name="eligibility.maxParentIncome"
                  value={form.eligibilityCriteria.maxParentIncome}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="500000"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? <Loader /> : '➕ Create Funding Program'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-large"
              onClick={() => setForm({
                name: '',
                description: '',
                amount: '',
                eligibilityCriteria: {
                  tenthMarks: '',
                  twelfthMarks: '',
                  collegeCGPA: '',
                  maxParentIncome: '',
                },
              })}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
