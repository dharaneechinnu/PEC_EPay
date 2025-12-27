import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

const VerifierRegister = () => {
  const [formData, setFormData] = useState({
    institutionName: "",
    institutionType: "",
    institutionCode: "",
    contactEmail: "",
    contactPerson: "",
    requestMessage: "",
    website: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:3500/verifier/register",
        formData
      );

      if (res.status === 200 || res.status === 201) {
        setMessage("✅ Verifier request submitted successfully!");
        // redirect to verifier login after short delay
        setTimeout(() => navigate('/Verifier/Login'), 700);
      } else {
        setMessage("❌ Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setMessage("⚠️ Server error. Please check your backend connection.");
    } finally {
      setLoading(false);
    }
  };

  // 🌐 Background animation
  useEffect(() => {
    const canvas = document.getElementById("network-bg");
    const ctx = canvas.getContext("2d");
    let particlesArray = [];
    const numParticles = 70;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    class Particle {
      constructor(x, y, size, speedX, speedY) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = "#00cfff";
        ctx.fill();
      }
    }

    function connect() {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          const dx = particlesArray[a].x - particlesArray[b].x;
          const dy = particlesArray[a].y - particlesArray[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            ctx.strokeStyle = "rgba(0, 210, 255, 0.25)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function init() {
      particlesArray = [];
      for (let i = 0; i < numParticles; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const speedX = (Math.random() - 0.5) * 1.5;
        const speedY = (Math.random() - 0.5) * 1.5;
        particlesArray.push(new Particle(x, y, size, speedX, speedY));
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      connect();
      requestAnimationFrame(animate);
    }

    init();
    animate();
  }, []);

  return (
    <>
      <style>
        {`
          body {
            margin: 0;
            overflow: hidden;
          }

          .verifier-register-page {
            position: relative;
            width: 100%;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: radial-gradient(circle at center, #001c40, #000820);
            font-family: 'Poppins', sans-serif;
            color: white;
            padding: 0 20px;
            box-sizing: border-box;
          }

          #network-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
          }

          /* 💎 Centered Glassmorphism Container */
          .verifier-container {
            position: relative;
            z-index: 2;
            width: 100%;
            max-width: 600px; /* 👈 Keeps equal left-right margin */
            padding: 40px 50px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(15px);
            box-shadow: 0 0 30px rgba(0, 229, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.25);
            animation: fadeIn 1.5s ease;
            box-sizing: border-box;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .verifier-heading {
            text-align: center;
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(90deg, #00cfff, #ffffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 30px;
          }

          .verifier-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .verifier-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
            align-items: start;
          }

          .verifier-form-grid .left,
          .verifier-form-grid .right {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          /* make textarea full-row when placed below the grid */
          .verifier-form-grid .right textarea {
            min-height: 100%;
            height: 100%;
            resize: vertical;
          }
          .verifier-textarea {
            min-height: 160px;
            width: 100%;
            resize: vertical;
            padding: 14px;
            font-size: 15px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.4);
            outline: none;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            transition: all 0.3s ease;
            box-sizing: border-box;
          }

          .verifier-input,
          .verifier-textarea,
          .verifier-select {
            width: 100%;
            padding: 14px;
            font-size: 15px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.4);
            outline: none;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            transition: all 0.3s ease;
            appearance: none;
            box-sizing: border-box;
          }

          .verifier-input::placeholder,
          .verifier-textarea::placeholder {
            color: #d8f6ff;
          }

          .verifier-input:focus,
          .verifier-textarea:focus,
          .verifier-select:focus {
            border-color: #00cfff;
            box-shadow: 0 0 8px rgba(0, 207, 255, 0.6);
          }

          /* 🌈 Custom Dropdown */
          .verifier-select {
            background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='18' viewBox='0 0 24 24' width='18' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
            background-repeat: no-repeat;
            background-position: right 12px center;
            background-size: 18px;
          }

          option {
            background-color: rgba(0, 31, 63, 0.95);
            color: #bdeaff;
          }

          .verifier-textarea {
            min-height: 90px;
            resize: vertical;
          }

          .verifier-button {
            background: linear-gradient(90deg, #00cfff, #007bff);
            color: white;
            padding: 14px;
            font-size: 16px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: 0.3s ease;
            font-weight: 600;
          }

          .verifier-button:hover {
            background: linear-gradient(90deg, #33d1ff, #3399ff);
            box-shadow: 0 0 20px rgba(0, 225, 255, 0.6);
          }

          .verifier-message {
            margin-top: 20px;
            text-align: center;
            font-weight: 500;
            color: #b3ffb3;
          }

          @media (max-width: 768px) {
            .verifier-container {
              padding: 30px 25px;
              max-width: 90%;
            }
          }
        `}
      </style>

      <div className="verifier-register-page">
        <canvas id="network-bg"></canvas>

        <div className="verifier-container">
          <h2 className="verifier-heading">Verifier Registration</h2>

          <form onSubmit={handleSubmit} className="verifier-form">
            <div className="verifier-form-grid">
              <div className="left">
                <input
                  type="text"
                  name="institutionName"
                  placeholder="Institution Name"
                  value={formData.institutionName}
                  onChange={handleChange}
                  required
                  className="verifier-input"
                />

                <select
                  name="institutionType"
                  value={formData.institutionType}
                  onChange={handleChange}
                  required
                  className="verifier-select"
                >
                  <option value="">Select Institution Type</option>
                  <option value="college">College</option>
                  <option value="university">University</option>
                  <option value="school">School</option>
                </select>

                <input
                  type="text"
                  name="institutionCode"
                  placeholder="Institution Code"
                  value={formData.institutionCode}
                  onChange={handleChange}
                  required
                  className="verifier-input"
                />
              </div>

              <div className="right">
                <input
                  type="email"
                  name="contactEmail"
                  placeholder="Contact Email"
                  value={formData.contactEmail}
                  onChange={handleChange}
                  required
                  className="verifier-input"
                />

                <input
                  type="text"
                  name="contactPerson"
                  placeholder="Contact Person"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  required
                  className="verifier-input"
                />

                <input
                  type="text"
                  name="website"
                  placeholder="Institution Website"
                  value={formData.website}
                  onChange={handleChange}
                  className="verifier-input"
                />
              </div>
            </div>

            {/* Full-width request message row spanning both columns */}
            <div style={{ marginTop: 18 }}>
              <textarea
                name="requestMessage"
                placeholder="Enter your request message..."
                value={formData.requestMessage}
                onChange={handleChange}
                required
                className="verifier-textarea"
              ></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
              <button type="submit" className="verifier-button" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>

          {message && <p className="verifier-message">{message}</p>}
        </div>
      </div>
    </>
  );
};

export default VerifierRegister;
