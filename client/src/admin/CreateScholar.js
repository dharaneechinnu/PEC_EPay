import React, { useState } from "react";
import axios from "axios";
import styled from "styled-components";

// ---------- Styled Components ----------
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f9fbff, #e6f3ff);
  padding: 40px;
  font-family: 'Poppins', sans-serif;
`;

/* ---- Form Container ---- */
const FormContainer = styled.div`
  width: 100%;
  max-width: 950px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 162, 255, 0.15);
  overflow: hidden;
  border: 2px solid #bde0ff;
`;

/* ---- Title Bar ---- */
const TitleBar = styled.div`
  background: linear-gradient(90deg, #00a2ff, #4db8ff);
  color: #ffffff;
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
  padding: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

/* ---- Form Layout ---- */
const Form = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 35px 40px;
  background: #ffffff;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 25px 20px;
  }
`;

/* ---- Field Group ---- */
const FieldGroup = styled.div`
  flex: 1 1 calc(50% - 20px);
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    flex: 1 1 100%;
  }
`;

/* ---- Label ---- */
const Label = styled.label`
  font-weight: 600;
  color: #007bff;
  margin-bottom: 6px;
  font-size: 0.95rem;
`;

/* ---- Input ---- */
const Input = styled.input`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1.5px solid #bcdfff;
  background: #f5f9ff;
  color: #1e3a8a;
  font-size: 0.95rem;
  transition: 0.2s ease;

  &:focus {
    border-color: #00a2ff;
    background: #ffffff;
    outline: none;
    box-shadow: 0 0 4px rgba(0, 162, 255, 0.25);
  }
`;

/* ---- Textarea ---- */
const Textarea = styled.textarea`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1.5px solid #bcdfff;
  background: #f5f9ff;
  color: #1e3a8a;
  font-size: 0.95rem;
  resize: vertical;
  transition: 0.2s ease;

  &:focus {
    border-color: #00a2ff;
    background: #ffffff;
    outline: none;
    box-shadow: 0 0 4px rgba(0, 162, 255, 0.25);
  }
`;

/* ---- Select ---- */
const Select = styled.select`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1.5px solid #bcdfff;
  background: #f5f9ff;
  color: #1e3a8a;
  font-size: 0.95rem;
  cursor: pointer;
  transition: 0.2s ease;

  &:focus {
    border-color: #00a2ff;
    background: #ffffff;
    outline: none;
    box-shadow: 0 0 4px rgba(0, 162, 255, 0.25);
  }
`;

/* ---- Button Container ---- */
const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 10px;
`;

/* ---- Button ---- */
const Button = styled.button`
  padding: 12px 25px;
  border-radius: 8px;
  background: linear-gradient(90deg, #00a2ff, #4db8ff);
  color: #ffffff;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.4px;
  box-shadow: 0 4px 10px rgba(0, 162, 255, 0.25);

  &:hover {
    background: linear-gradient(90deg, #0092e5, #33b1ff);
    transform: translateY(-2px);
  }
`;

/* ---- Message ---- */
const Message = styled.div`
  text-align: center;
  font-weight: 600;
  color: ${(props) => (props.error ? "#f44336" : "#00a2ff")};
  margin-bottom: 10px;
  margin-top: 15px;
`;


// ---------- Main Component ----------
const CreateScholar = () => {
  const [form, setForm] = useState({
    scholarshipName: "",
    providerName: "",
    description: "",
    tenthMarks: "",
    twelfthMarks: "",
    collegeCGPA: "",
    maxParentIncome: "",
    womenPreference: true,
    academicPerformance: "",
    disabilityAllowed: "None",
    extracurricular: "",
    firstGenGraduate: true,
    specialCategory: "",
    applicationDeadline: "",
    scholarshipAmount: "",
    createdBy: "",
    isActive: true,
  });

  // derive admin id from localStorage (adminAuth set at login)
  const getAdminIdFromStorage = () => {
    try {
      const raw = localStorage.getItem('adminAuth');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      // parsed may be { admin: { _id, ... }, token, message } or directly the admin object
      if (parsed.admin && parsed.admin._id) return parsed.admin._id;
      if (parsed._id) return parsed._id;
      return '';
    } catch (e) {
      console.warn('Could not parse adminAuth from localStorage', e);
      return '';
    }
  };
  const adminId = getAdminIdFromStorage();
console.log("Admin ID:", adminId);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  // Dropdown options based on model enums
  const disabilityOptions = [
    "None",
    "Physical Disability",
    "Visual Impairment",
    "Hearing Impairment",
    "Other Disability",
  ];

  const extracurricularOptions = [
    "Sports & Fitness",
    "Technical & Innovation",
    "Academic & Research Activities",
    "Leadership & Volunteering",
    "Entrepreneurship & Startups",
  ];

  const performanceOptions = [
    "Excellent",
    "Very Good",
    "Good",
    "Average",
    "Any",
  ];

  const categoryOptions = [
    "Single Parent",
    "Orphan",
    "Minority Community",
    "First Generation Graduate",
    "Economically Weaker Section",
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError(false);

    const payload = {
      scholarshipName: form.scholarshipName,
      providerName: form.providerName,
      description: form.description,
      eligibilityCriteria: {
        tenthMarks: Number(form.tenthMarks),
        twelfthMarks: Number(form.twelfthMarks),
        collegeCGPA: Number(form.collegeCGPA),
        maxParentIncome: Number(form.maxParentIncome),
        womenPreference: form.womenPreference === "true",
        academicPerformance: form.academicPerformance,
        disabilityAllowed: [form.disabilityAllowed],
        extracurricular: [form.extracurricular],
        firstGenGraduate: form.firstGenGraduate === "true",
        specialCategory: [form.specialCategory],
      },
      applicationDeadline: form.applicationDeadline,
      scholarshipAmount: Number(form.scholarshipAmount),
      isActive: true,
  createdBy: adminId,
    };

    try {
      const res = await axios.post("http://localhost:3500/admin/createscholarship", payload);
      if (res.status === 200 || res.status === 201) {
        setMessage("🎉 Scholarship created successfully!");
        setForm({
          scholarshipName: "",
          providerName: "",
          description: "",
          tenthMarks: "",
          twelfthMarks: "",
          collegeCGPA: "",
          maxParentIncome: "",
          womenPreference: true,
          academicPerformance: "",
          disabilityAllowed: "None",
          extracurricular: "",
          firstGenGraduate: true,
          specialCategory: "",
          applicationDeadline: "",
          scholarshipAmount: "",
          createdBy: adminId,
          isActive: true,
        });
      }
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || "❌ Failed to create scholarship");
    }
  };

  return (
    <PageContainer>
      <FormContainer>
        <TitleBar>Create Scholarship</TitleBar>
        <Form onSubmit={handleSubmit}>
          {message && <Message error={error}>{message}</Message>}

          <FieldGroup>
            <Label>Scholarship Name</Label>
            <Input name="scholarshipName" value={form.scholarshipName} onChange={handleChange} required />
          </FieldGroup>

          <FieldGroup>
            <Label>Provider Name</Label>
            <Input name="providerName" value={form.providerName} onChange={handleChange} required />
          </FieldGroup>

          <FieldGroup style={{ flex: "1 1 100%" }}>
            <Label>Description</Label>
            <Textarea name="description" value={form.description} onChange={handleChange} rows={4} required />
          </FieldGroup>

          <FieldGroup>
            <Label>10th Marks (%)</Label>
            <Input name="tenthMarks" value={form.tenthMarks} onChange={handleChange} required />
          </FieldGroup>

          <FieldGroup>
            <Label>12th Marks (%)</Label>
            <Input name="twelfthMarks" value={form.twelfthMarks} onChange={handleChange} required />
          </FieldGroup>

          <FieldGroup>
            <Label>College CGPA</Label>
            <Input name="collegeCGPA" value={form.collegeCGPA} onChange={handleChange} required />
          </FieldGroup>

          <FieldGroup>
            <Label>Max Parent Income (₹)</Label>
            <Input name="maxParentIncome" value={form.maxParentIncome} onChange={handleChange} required />
          </FieldGroup>

          <FieldGroup>
            <Label>Academic Performance</Label>
            <Select name="academicPerformance" value={form.academicPerformance} onChange={handleChange} required>
              <option value="">Select</option>
              {performanceOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label>Disability Allowed</Label>
            <Select name="disabilityAllowed" value={form.disabilityAllowed} onChange={handleChange}>
              {disabilityOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label>Extracurricular</Label>
            <Select name="extracurricular" value={form.extracurricular} onChange={handleChange}>
              <option value="">Select</option>
              {extracurricularOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label>Special Category</Label>
            <Select name="specialCategory" value={form.specialCategory} onChange={handleChange}>
              <option value="">Select</option>
              {categoryOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label>Application Deadline</Label>
            <Input type="date" name="applicationDeadline" value={form.applicationDeadline} onChange={handleChange} />
          </FieldGroup>

          <FieldGroup>
            <Label>Scholarship Amount (₹)</Label>
            <Input type="number" name="scholarshipAmount" value={form.scholarshipAmount} onChange={handleChange} />
          </FieldGroup>

          <ButtonContainer>
            <Button type="submit">Create Scholarship</Button>
          </ButtonContainer>
        </Form>
      </FormContainer>
    </PageContainer>
  );
};

export default CreateScholar;
