import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

const StudentLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // Handle login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data, status } = await axios.post("http://localhost:3500/student/login", formData);
      if (status === 200) {
        setMessage("✅ Login successful!");
        console.log("Student Logged In:", data);
        // store token and redirect to student dashboard
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        // slight delay so user sees message, then navigate
        setTimeout(() => {
          navigate('/Student/Dashboard');
        }, 450);
      } else setMessage("❌ Invalid email or password.");
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Login failed. Check your credentials or server.");
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();

  // Background particle animation
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

    for (let i = 0; i < num; i++) particles.push(new Particle());

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

          .student-login {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
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

          .container {
            z-index: 1;
            width: 360px;
            padding: 35px;
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: 0 0 25px rgba(0, 229, 255, 0.2);
            animation: fadeIn 1.2s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          h2 {
            text-align: center;
            font-size: 1.8rem;
            margin-bottom: 25px;
            background: linear-gradient(90deg, #00cfff, #ffffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          form {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          input {
            padding: 12px;
            font-size: 15px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            outline: none;
            transition: all 0.3s ease;
          }

          input:focus {
            border-color: #00cfff;
            box-shadow: 0 0 8px rgba(0, 207, 255, 0.6);
          }

          ::placeholder {
            color: #b8ecff;
          }

          button {
            padding: 12px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(90deg, #00cfff, #007bff);
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.3s ease;
          }

          button:hover {
            background: linear-gradient(90deg, #33d1ff, #3399ff);
            box-shadow: 0 0 20px rgba(0, 225, 255, 0.6);
          }

          p {
            text-align: center;
            margin-top: 15px;
            color: #aef2ff;
            font-size: 0.95rem;
          }
        `}
      </style>

      <div className="student-login">
        <canvas id="bg"></canvas>

        <div className="container">
          <h2>Student Login</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          {message && <p>{message}</p>}
        </div>
      </div>
    </>
  );
};

export default StudentLogin;
