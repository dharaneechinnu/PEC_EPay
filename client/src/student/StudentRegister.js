import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";

const StudentRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    gender: "",
    mobileNo: "",
    address: "",
    parentAddress: "",
    institution: "",
    classOrYear: "",
    marksPercentage: "",
    familyIncome: "",
    hasIncomeCertificate: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://localhost:3500/student/register", formData);
      if (res.status === 200 || res.status === 201) {
        setMessage("✅ Registration successful! Redirecting to login...");
        setFormData({
          name: "",
          email: "",
          password: "",
          dob: "",
          gender: "",
          mobileNo: "",
          address: "",
          parentAddress: "",
          institution: "",
          classOrYear: "",
          marksPercentage: "",
          familyIncome: "",
          hasIncomeCertificate: "",
        });
        // Give the user a moment to see the success message, then navigate to login
        setTimeout(() => navigate('/Student/Login'), 900);
      }
    } catch (error) {
      console.error(error);
      setMessage("⚠️ Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  // 🌌 Background Animation
  useEffect(() => {
    const canvas = document.getElementById("bg");
    const ctx = canvas.getContext("2d");
    let particles = [];
    const num = 70;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 1.2;
        this.speedY = (Math.random() - 0.5) * 1.2;
      }
      move() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "#00eaff";
        ctx.fill();
      }
    }

    const connect = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.strokeStyle = "rgba(0, 255, 255, 0.2)";
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    for (let i = 0; i < num; i++) particles.push(new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.move();
        p.draw();
      });
      connect();
      requestAnimationFrame(animate);
    };
    animate();
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <>
      <style>
        {`
          body {
            margin: 0;
            overflow: hidden;
            font-family: 'Poppins', sans-serif;
            background: radial-gradient(circle at center, #001a35, #000817);
          }

          .register-page {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            position: relative;
            color: white;
          }

          #bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
          }

          .register-container {
            z-index: 1;
            width: 700px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 40px 45px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: 0 0 25px rgba(0, 229, 255, 0.25);
            animation: fadeIn 1.2s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          h2 {
            text-align: center;
            font-size: 2rem;
            margin-bottom: 30px;
            background: linear-gradient(90deg, #00cfff, #ffffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          form {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 18px 20px;
            align-items: start;
          }

          input, select, textarea {
            padding: 12px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.08);
            color: #ffffffff;
            outline: none;
            transition: all 0.3s ease;
            width: 100%;
            box-sizing: border-box;
          }

          /* Labels for accessibility */
          label {
            display: block;
            font-size: 14px;
            color: #bfeeff;
            margin-bottom: 6px;
            font-weight: 600;
          }

          input:focus, select:focus, textarea:focus {
            border-color: #00cfff;
            box-shadow: 0 0 8px rgba(0, 207, 255, 0.6);
          }

          select {
            background: rgba(0, 207, 255, 0.15);
            color: #6dade2ff;
            font-weight: 500;
          }

          textarea {
            resize: none;
            min-height: 60px;
          }

          ::placeholder { color: #b8ecff; }

          button {
            grid-column: 1 / -1;
            padding: 12px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(90deg, #00cfff, #007bff);
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.3s ease;
            margin-top: 5px;
          }

          button:hover {
            background: linear-gradient(90deg, #33d1ff, #3399ff);
            box-shadow: 0 0 20px rgba(0, 225, 255, 0.6);
          }

          p {
            grid-column: 1 / -1;
            text-align: center;
            margin-top: 10px;
            color: #aef2ff;
          }

          @media (max-width: 600px) {
            .register-container {
              width: 90%;
              padding: 25px;
            }
          }
        `}
      </style>

      <div className="register-page">
        <canvas id="bg"></canvas>

        <div className="register-container">
          <h2>Student Registration</h2>

          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name">Full Name</label>
              <input id="name" type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input id="password" type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="dob">Date of Birth</label>
              <input id="dob" type="date" name="dob" value={formData.dob} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="gender">Gender</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="mobileNo">Mobile Number</label>
              <input id="mobileNo" type="text" name="mobileNo" placeholder="Mobile Number" value={formData.mobileNo} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="address">Residential Address</label>
              <textarea id="address" name="address" placeholder="Residential Address" value={formData.address} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="parentAddress">Parent Address</label>
              <textarea id="parentAddress" name="parentAddress" placeholder="Parent Address" value={formData.parentAddress} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="institution">Institution Name</label>
              <input id="institution" type="text" name="institution" placeholder="Institution Name" value={formData.institution} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="classOrYear">Class / Year</label>
              <input id="classOrYear" type="text" name="classOrYear" placeholder="Class / Year" value={formData.classOrYear} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="marksPercentage">Marks Percentage</label>
              <input id="marksPercentage" type="number" name="marksPercentage" placeholder="Marks Percentage" value={formData.marksPercentage} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="familyIncome">Family Income</label>
              <input id="familyIncome" type="number" name="familyIncome" placeholder="Family Income" value={formData.familyIncome} onChange={handleChange} required />
            </div>

            <div>
              <label htmlFor="hasIncomeCertificate">Do you have an income certificate?</label>
              <select id="hasIncomeCertificate" name="hasIncomeCertificate" value={formData.hasIncomeCertificate} onChange={handleChange} required>
                <option value="">Do you have an income certificate?</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>
            {message && <p>{message}</p>}
          </form>
        </div>
      </div>
    </>
  );
};

export default StudentRegister;
