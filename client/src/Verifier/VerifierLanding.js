import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const VerifierLanding = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 🌐 Background network animation
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
          .verifier-landing {
            position: relative;
            width: 100%;
            height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            background: radial-gradient(circle at center, #001c40, #000820);
          }

          #network-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
          }

          /* ✨ Top Navigation Buttons */
          .top-right-buttons {
            position: absolute;
            top: 30px;
            right: 40px;
            display: flex;
            gap: 15px;
            z-index: 2;
          }

          .verifier-btn {
            padding: 10px 22px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .verifier-btn.login {
            background-color: #ffffff;
            color: #007bff;
          }

          .verifier-btn.login:hover {
            background-color: #e9e9e9;
          }

          .verifier-btn.register {
            background-color: #00cfff;
            color: white;
          }

          .verifier-btn.register:hover {
            background-color: #00a6d9;
          }

          /* ✨ Centered Content */
          .landing-content {
            position: relative;
            z-index: 1;
            text-align: center;
            animation: fadeIn 2.5s ease-in-out;
          }

          @keyframes fadeIn {
            0% { opacity: 0; transform: scale(0.8); }
            100% { opacity: 1; transform: scale(1); }
          }

          .landing-title {
            font-size: 8rem;
            font-weight: 900;
            letter-spacing: 8px;
            margin-bottom: 30px;
            background: linear-gradient(90deg, #00cfff, #b3ecff, #ffffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 80px rgba(173, 255, 255, 0.6);
            animation: glowPulse 4s ease-in-out infinite;
          }

          @keyframes glowPulse {
            0%, 100% { text-shadow: 0 0 80px rgba(173, 255, 255, 0.6); }
            50% { text-shadow: 0 0 120px rgba(255, 255, 255, 0.9); }
          }

          @media (max-width: 768px) {
            .landing-title {
              font-size: 4rem;
              letter-spacing: 4px;
            }
          }

          .landing-subtext {
            font-size: 1.4rem;
            color: #d9f6ff;
            font-weight: 400;
            letter-spacing: 1px;
          }
        `}
      </style>

      <div className="verifier-landing">
        <canvas id="network-bg"></canvas>

        {/* 🔝 Top Right Buttons */}
        <div className="top-right-buttons">
          <button
            className="verifier-btn login"
            onClick={() => navigate("/Verifier/Login")}
          >
            Login
          </button>
          <button
            className="verifier-btn register"
            onClick={() => navigate("/Verifier/Register")}
          >
            Register
          </button>
        </div>

        {/* 🌟 Centered Hero Text */}
        <div className="landing-content">
          <h1 className="landing-title">FAST SCHOLAR</h1>
          <p className="landing-subtext">
            Empowering institutions with smart, secure, and verified records.
          </p>
        </div>
      </div>
    </>
  );
};

export default VerifierLanding;
