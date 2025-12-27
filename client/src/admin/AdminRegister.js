import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    orgName: "",
    donorType: "",
    contactPerson: "",
    contactEmail: "",
    website: "",
    requestMessage: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      const res = await axios.post("http://localhost:3500/admin/register", formData);
      if (res.status === 201 || res.status === 200) {
        setMessage("✅ Registration request submitted successfully! Redirecting to login...");
        setFormData({
          orgName: "",
          donorType: "",
          contactPerson: "",
          contactEmail: "",
          website: "",
          requestMessage: "",
        });
        setTimeout(() => {
          navigate("/Admin/Login");
        }, 1500);
      } else {
        setMessage("❌ Failed to submit. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setMessage("⚠️ Server error. Please check your inputs or connection.");
    } finally {
      setLoading(false);
    }
  };

  // 🌌 Background particle animation (same as AdminLogin)
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
        ctx.fillStyle = "#ffae00";
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
            ctx.strokeStyle = "rgba(255, 174, 0, 0.25)";
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

          .admin-register-page {
            position: relative;
            width: 100%;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            background: radial-gradient(circle at center, #2b1b00, #000000);
            font-family: 'Poppins', sans-serif;
            color: white;
          }

          #network-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
          }

          .admin-register-container {
            position: relative;
            z-index: 2;
            width: 450px;
            padding: 40px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            box-shadow: 0 0 30px rgba(255, 174, 0, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.25);
            animation: fadeIn 1.5s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .admin-register-title {
            text-align: center;
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(90deg, #ffae00, #ffffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 25px;
          }

          .admin-register-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .admin-register-input, .admin-register-textarea, .admin-register-select {
            padding: 14px;
            font-size: 15px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.4);
            outline: none;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            transition: all 0.3s ease;
          }

          .admin-register-input::placeholder,
          .admin-register-textarea::placeholder {
            color: #ffe8b3;
          }

          .admin-register-input:focus,
          .admin-register-textarea:focus,
          .admin-register-select:focus {
            border-color: #ffae00;
            box-shadow: 0 0 8px rgba(255, 174, 0, 0.6);
          }

          .admin-register-button {
            background: linear-gradient(90deg, #ffae00, #ff6600);
            color: white;
            padding: 14px;
            font-size: 16px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: 0.3s ease;
            font-weight: 600;
          }

          .admin-register-button:hover {
            background: linear-gradient(90deg, #ffc233, #ff8533);
            box-shadow: 0 0 20px rgba(255, 174, 0, 0.6);
          }

          .admin-message {
            text-align: center;
            margin-top: 20px;
            color: #fff1b3;
            font-weight: 500;
          }
        `}
      </style>

      <div className="admin-register-page">
        <canvas id="network-bg"></canvas>

        <div className="admin-register-container">
          <h2 className="admin-register-title">Admin Registration</h2>

          <form className="admin-register-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="orgName"
              placeholder="Organization Name"
              value={formData.orgName}
              onChange={handleChange}
              required
              className="admin-register-input"
            />

            <select
              name="donorType"
              value={formData.donorType}
              onChange={handleChange}
              required
              className="admin-register-select"
            >
              <option value="">Select Donor Type</option>
              <option value="NGO">NGO</option>
              <option value="Corporate">Corporate</option>
              <option value="Individual">Individual</option>
            </select>

            <input
              type="text"
              name="contactPerson"
              placeholder="Contact Number or Person"
              value={formData.contactPerson}
              onChange={handleChange}
              required
              className="admin-register-input"
            />

            <input
              type="email"
              name="contactEmail"
              placeholder="Contact Email"
              value={formData.contactEmail}
              onChange={handleChange}
              required
              className="admin-register-input"
            />

            <input
              type="text"
              name="website"
              placeholder="Website URL"
              value={formData.website}
              onChange={handleChange}
              className="admin-register-input"
            />

            <textarea
              name="requestMessage"
              placeholder="Request Message"
              value={formData.requestMessage}
              onChange={handleChange}
              rows="3"
              className="admin-register-textarea"
            ></textarea>

            <button type="submit" className="admin-register-button" disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>

          {message && <p className="admin-message">{message}</p>}
        </div>
      </div>
    </>
  );
};

export default AdminRegister;
