import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

/* 🌐 Verifier Components */
import VerifierLanding from "./Verifier/VerifierLanding";
import VerifierRegister from "./Verifier/VerifierRegister";
import VerifierLogin from "./Verifier/VerifierLogin";
import VerifierDashboard from "./Verifier/VerifierDashboard";
import VerifierViewScholarships from "./Verifier/VerifierViewScholarships";
import VerifierApply from "./Verifier/VerifierApply";

/* 🎓 Student Components */
import StudentLogin from "./student/StudentLogin";
import StudentRegister from "./student/StudentRegister";
import StudentDashboard from "./student/StudentDashboard";
import ViewScholarships from "./student/ViewScholarships";

/* 🧑‍💼 Admin Components */
import AdminLogin from "./admin/AdminLogin";
import AdminRegister from "./admin/AdminRegister";
import AdminDashboard from "./admin/AdminDashboard";

/* 🛡 Super Admin Component */
import SuperAdminDashboard from "./superadmin/SuperAdminDashboard";

function App() {
  return (
    <Router>
      <Routes>

        {/* 🌐 Verifier Routes */}
        <Route path="/" element={<VerifierLanding />} />
        <Route path="/verifier/login" element={<VerifierLogin />} />
        <Route path="/verifier/register" element={<VerifierRegister />} />
        <Route path="/verifier/dashboard" element={<VerifierDashboard />} />
        <Route path="/verifier/viewscholarships" element={<VerifierViewScholarships />} />
        <Route path="/verifier/apply" element={<VerifierApply />} />

        {/* 🎓 Student Routes */}
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/viewscholarships" element={<ViewScholarships />} />

        {/* 🧑‍💼 Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* 🛡 Super Admin Route */}
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />

      </Routes>
    </Router>
  );
}

export default App;
