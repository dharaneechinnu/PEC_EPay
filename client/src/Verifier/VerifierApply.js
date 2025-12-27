import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";

// ---------- Styled Components ----------
const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f9fbff, #edf6ff); /* soft, bright gradient */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
`;

/* ---- Form Card ---- */
const FormCard = styled.div`
  width: 100%;
  max-width: 900px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 162, 255, 0.12);
  overflow: hidden;
  border: 2px solid #bde0ff;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 10px 28px rgba(0, 162, 255, 0.18);
    border-color: #4daafc;
  }
`;

/* ---- Title Bar ---- */
const TitleBar = styled.div`
  background: linear-gradient(90deg, #00a2ff, #4daafc);
  color: #ffffff;
  font-size: 1.6rem;
  font-weight: 700;
  text-align: center;
  padding: 18px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
`;

/* ---- Form Body ---- */
const Form = styled.form`
  padding: 36px 42px;
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

/* ---- Grid Layout ---- */
const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

/* ---- Labels ---- */
const Label = styled.label`
  font-weight: 600;
  color: #007bff;
  margin-bottom: 6px;
  font-size: 0.95rem;
`;

/* ---- Input Fields ---- */
const Input = styled.input`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1.5px solid #cce5ff;
  background: #f5f9ff;
  color: #1e3a8a;
  font-size: 0.95rem;
  transition: 0.2s ease;

  &:focus {
    border-color: #00a2ff;
    background: #ffffff;
    outline: none;
    box-shadow: 0 0 5px rgba(0, 162, 255, 0.25);
  }
`;

/* ---- Select ---- */
const Select = styled.select`
  padding: 10px 12px;
  border-radius: 6px;
  border: 1.5px solid #cce5ff;
  background: #f5f9ff;
  color: #1e3a8a;
  font-size: 0.95rem;
  transition: 0.2s ease;

  &:focus {
    border-color: #00a2ff;
    background: #ffffff;
    outline: none;
    box-shadow: 0 0 5px rgba(0, 162, 255, 0.25);
  }
`;

/* ---- Checkbox ---- */
const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #1e40af;
  font-size: 0.95rem;
`;

/* ---- Fieldset ---- */
const Fieldset = styled.fieldset`
  border: 1.5px solid #bde0ff;
  border-radius: 8px;
  padding: 18px 22px;
  background: #f9fbff;
  transition: border 0.2s ease;

  &:hover {
    border-color: #4daafc;
  }
`;

const Legend = styled.legend`
  font-weight: 700;
  color: #00a2ff;
  font-size: 1rem;
`;

/* ---- Submit Button ---- */
const Button = styled.button`
  align-self: center;
  padding: 12px 28px;
  border-radius: 8px;
  background: linear-gradient(90deg, #00a2ff, #4daafc);
  color: #ffffff;
  font-weight: 700;
  border: none;
  cursor: pointer;
  margin-top: 10px;
  letter-spacing: 0.4px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0, 162, 255, 0.2);

  &:hover {
    background: linear-gradient(90deg, #0092e5, #33b1ff);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 162, 255, 0.25);
  }
`;

/* ---- Message ---- */
const Message = styled.div`
  text-align: center;
  color: ${(props) => (props.error ? "#f44336" : "#00a2ff")};
  font-weight: 600;
  margin-top: 14px;
  font-size: 0.95rem;
`;



// ---------- Main Component ----------
const VerifierApply = () => {
  const [form, setForm] = useState({
    verifierId: "",
    scholarshipId: "",
    studentname: "",
    studentemail: "",
    studentid: "",
    gender: "male",
    institutionname: "",
    classoryear: "",
    familyIncome: "",
    fundedraised: "",
    donorid: "",
    tenthMarks: "",
    twelfthMarks: "",
    firstGenGraduate: false,
    payoutDetails: {
      beneficiaryId: "",
      accountHolderName: "",
      accountNumber: "",
      maskedAccountNumber: "",
      ifsc: "",
      bankName: "",
      email: "",
      phone: "",
      beneficiaryVerified: false,
    },
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Autofill hidden IDs from localStorage or navigation
  // helper to read verifier id from localStorage (supports common shapes)
  const readVerifierId = () => {
    try {
      const raw = localStorage.getItem('verifierAuth');
      if (!raw) return '';
      const parsed = JSON.parse(raw);
      // shapes: { verifier: { _id } }, { verifier: { id } }, { _id }, { id }, { verifierId }
      if (parsed && parsed.verifier && (parsed.verifier._id || parsed.verifier.id)) return parsed.verifier._id || parsed.verifier.id;
      if (parsed && (parsed._id || parsed.id)) return parsed._id || parsed.id;
      if (parsed && parsed.verifierId) return parsed.verifierId;
      return '';
    } catch (err) {
      return '';
    }
  };

  useEffect(() => {
    const lsVerifier = localStorage.getItem("verifierAuth");
    const state = location?.state || {};
    const qs = new URLSearchParams(window.location.search);
    const id = state.scholarshipId || qs.get("scholarshipId");
    const donorid = state.donorid || qs.get("donorid");

    if (lsVerifier) {
      const parsed = JSON.parse(lsVerifier);
      const vid =
        parsed?.verifier?._id ||
        parsed?.verifierId ||
        parsed?._id ||
        parsed?.id ||
        "";
      setForm((prev) => ({ ...prev, verifierId: vid }));
    }

    if (id) setForm((prev) => ({ ...prev, scholarshipId: id }));
    if (donorid) setForm((prev) => ({ ...prev, donorid }));
  }, [location]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePayoutChange = (e) =>
    setForm((prev) => ({
      ...prev,
      payoutDetails: {
        ...prev.payoutDetails,
        [e.target.name]: e.target.value,
      },
    }));

  const handleCheckbox = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.checked }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError(false);
    setLoading(true);

    try {
      // build payload from form and ensure verifierId is present
      const payload = { ...form };
      if (!payload.verifierId) payload.verifierId = readVerifierId();
      const res = await axios.post("http://localhost:3500/verifier/applyscholarship", payload);
      if (res.status === 200 || res.status === 201) {
        setMsg("🎉 Application submitted successfully!");
        // keep IDs in form state but clear other fields
        setForm({
          verifierId: form.verifierId,
          scholarshipId: form.scholarshipId,
          donorid: form.donorid,
          studentname: "",
          studentemail: "",
          studentid: "",
          gender: "male",
          institutionname: "",
          classoryear: "",
          familyIncome: "",
          fundedraised: "",
          tenthMarks: "",
          twelfthMarks: "",
          firstGenGraduate: false,
          payoutDetails: {
            beneficiaryId: "",
            accountHolderName: "",
            accountNumber: "",
            maskedAccountNumber: "",
            ifsc: "",
            bankName: "",
            email: "",
            phone: "",
            beneficiaryVerified: false,
          },
        });

        // navigate to verifier dashboard after short delay so user sees success
        setTimeout(() => navigate("/Verifier/Dashboard"), 700);
      }
    } catch (err) {
      setError(true);
      setMsg(err.response?.data?.message || "❌ Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <FormCard>
        <TitleBar>Scholarship Application Form</TitleBar>
        <Form onSubmit={handleSubmit}>
          <Grid>
            <div>
              <Label>Student Name</Label>
              <Input
                name="studentname"
                value={form.studentname}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label>Student Email</Label>
              <Input
                name="studentemail"
                value={form.studentemail}
                onChange={handleChange}
                required
              />
            </div>
          </Grid>

          <Grid>
            
            <div>
              <Label>Gender</Label>
              <Select name="gender" value={form.gender} onChange={handleChange}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
          </Grid>

          <Grid>
            <div>
              <Label>Institution Name</Label>
              <Input
                name="institutionname"
                value={form.institutionname}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Class / Year</Label>
              <Input
                name="classoryear"
                value={form.classoryear}
                onChange={handleChange}
              />
            </div>
          </Grid>

          <Grid>
            <div>
              <Label>10th Marks (%)</Label>
              <Input
                name="tenthMarks"
                value={form.tenthMarks}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>12th Marks (%)</Label>
              <Input
                name="twelfthMarks"
                value={form.twelfthMarks}
                onChange={handleChange}
              />
            </div>
          </Grid>

          <Grid>
            <div>
              <Label>Family Income (₹)</Label>
              <Input
                name="familyIncome"
                value={form.familyIncome}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label>Funds Raised</Label>
              <Input
                name="fundedraised"
                value={form.fundedraised}
                onChange={handleChange}
              />
            </div>
          </Grid>

          <CheckboxLabel>
            <input
              type="checkbox"
              name="firstGenGraduate"
              checked={!!form.firstGenGraduate}
              onChange={handleCheckbox}
            />
            First Generation Graduate
          </CheckboxLabel>

          {/* ---------- Payout Details ---------- */}
          <Fieldset>
            <Legend>Payout Details</Legend>
            <Grid>
              <div>
                <Label>Beneficiary ID</Label>
                <Input
                  name="beneficiaryId"
                  value={form.payoutDetails.beneficiaryId}
                  onChange={handlePayoutChange}
                />
              </div>
              <div>
                <Label>Account Holder Name</Label>
                <Input
                  name="accountHolderName"
                  value={form.payoutDetails.accountHolderName}
                  onChange={handlePayoutChange}
                />
              </div>
            </Grid>

            <Grid>
              <div>
                <Label>Account Number</Label>
                <Input
                  name="accountNumber"
                  value={form.payoutDetails.accountNumber}
                  onChange={handlePayoutChange}
                />
              </div>
              
            </Grid>

            <Grid>
              <div>
                <Label>IFSC Code</Label>
                <Input
                  name="ifsc"
                  value={form.payoutDetails.ifsc}
                  onChange={handlePayoutChange}
                />
              </div>
              <div>
                <Label>Bank Name</Label>
                <Input
                  name="bankName"
                  value={form.payoutDetails.bankName}
                  onChange={handlePayoutChange}
                />
              </div>
            </Grid>

            <Grid>
              <div>
                <Label>Beneficiary Email</Label>
                <Input
                  name="email"
                  value={form.payoutDetails.email}
                  onChange={handlePayoutChange}
                />
              </div>
              <div>
                <Label>Beneficiary Phone</Label>
                <Input
                  name="phone"
                  value={form.payoutDetails.phone}
                  onChange={handlePayoutChange}
                />
              </div>
            </Grid>

            <CheckboxLabel>
              <input
                type="checkbox"
                name="beneficiaryVerified"
                checked={!!form.payoutDetails.beneficiaryVerified}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    payoutDetails: {
                      ...prev.payoutDetails,
                      beneficiaryVerified: e.target.checked,
                    },
                  }))
                }
              />
              Beneficiary Verified
            </CheckboxLabel>
          </Fieldset>

          {/* Hidden fields */}
          <input type="hidden" name="verifierId" value={form.verifierId} />
          <input type="hidden" name="scholarshipId" value={form.scholarshipId} />
          <input type="hidden" name="donorid" value={form.donorid} />

          <Button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Application"}
          </Button>

          {msg && <Message error={error}>{msg}</Message>}
        </Form>
      </FormCard>
    </PageContainer>
  );
};

export default VerifierApply;

