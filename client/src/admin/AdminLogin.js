
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
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
      // 🟢 API endpoint for Admin Login
      const res = await axios.post("http://localhost:3500/admin/login", formData);

      if (res.status === 200 && res.data) {
        // Persist auth info in localStorage for admin session
        try {
          localStorage.setItem('adminAuth', JSON.stringify(res.data));
        } catch (e) {
          console.warn('Could not write adminAuth to localStorage', e);
        }

        setMessage("✅ Admin login successful! Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/Admin/Dashboard");
        }, 700);
      } else {
        setMessage("❌ Invalid username or password.");
      }
    } catch (error) {
      console.error(error);
      setMessage("⚠️ Login failed. Please check your credentials or server.");
    } finally {
      setLoading(false);
    }
  };

  // 🌌 Background particle animation (same as VerifierLogin)
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

          .admin-login-page {
            position: relative;
            width: 100%;
            height: 100vh;
            overflow: hidden;
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

          /* 🟠 Glassmorphic Admin Login Box */
          .admin-login-container {
            position: relative;
            z-index: 2;
            width: 400px;
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

          .admin-login-title {
            text-align: center;
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(90deg, #ffae00, #ffffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 30px;
          }

          .admin-login-form {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }

          .admin-login-input {
            padding: 14px;
            font-size: 15px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.4);
            outline: none;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            transition: all 0.3s ease;
          }

          .admin-login-input::placeholder {
            color: #ffe8b3;
          }

          .admin-login-input:focus {
            border-color: #ffae00;
            box-shadow: 0 0 8px rgba(255, 174, 0, 0.6);
          }

          .admin-login-button {
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

          .admin-login-button:hover {
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

      <div className="admin-login-page">
        <canvas id="network-bg"></canvas>

        <div className="admin-login-container">
          <h2 className="admin-login-title">Admin Login</h2>

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Enter Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="admin-login-input"
            />

            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="admin-login-input"
            />

            <button
              type="submit"
              className="admin-login-button"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {message && <p className="admin-message">{message}</p>}
        </div>
      </div>
    </>
  );
};

export default AdminLogin;
