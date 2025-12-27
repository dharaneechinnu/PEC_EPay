import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';

/* 🎨 COLORS */
const colors = {
  orange: '#FF7A00',
  yellow: '#FFD36A',
  pink: '#FFB3A7',
  darkBg: '#0B0F14',
  textPrimary: '#F5F7FA',
  textSecondary: '#B8C0CC',
  track: '#2A3242'
};

/* 🌊 BG FLOAT */
const float = keyframes`
  0% { transform: translate(0,0); }
  50% { transform: translate(30px,-40px); }
  100% { transform: translate(0,0); }
`;

/* 🎞️ CONTENT ANIMATIONS */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;
const slideLeft = keyframes`
  from { opacity: 0; transform: translateX(-80px); }
  to { opacity: 1; transform: translateX(0); }
`;
const slideRight = keyframes`
  from { opacity: 0; transform: translateX(80px); }
  to { opacity: 1; transform: translateX(0); }
`;
const scaleUp = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

/* 🌍 SCROLL CONTAINER */
const ScrollContainer = styled.div`
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  background: radial-gradient(circle at top, #111827, ${colors.darkBg});
`;

/* 🌈 BACKGROUND BLOBS */
const BackgroundLayer = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
`;
const Blob = styled.div`
  position: absolute;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: 50%;
  background: radial-gradient(circle, ${({ color }) => color}, transparent 65%);
  filter: blur(60px);
  opacity: 0.9;
  animation: ${float} ${({ duration }) => duration}s ease-in-out infinite;
`;
const BlobOne = styled(Blob)` top: 10%; left: 5%; `;
const BlobTwo = styled(Blob)` top: 60%; right: 10%; `;
const BlobThree = styled(Blob)` bottom: 10%; left: 40%; `;

/* 🟠 TRACK */
const TrackWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 70px;
  height: 100vh;
  width: 140px;
  pointer-events: none;
  z-index: 1;
`;

/* 🧱 SECTION */
const Section = styled.section`
  height: 100vh;
  scroll-snap-align: start;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
`;

/* 🧠 CONTENT */
const AnimatedContent = styled.div`
  max-width: 900px;
  text-align: center;
  opacity: 0;

  ${({ visible, animation }) =>
    visible &&
    css`
      opacity: 1;
      animation: ${animation} 0.9s ease forwards;
    `}
`;

/* 🔠 TEXT */
const Brand = styled.h1`
  font-size: clamp(4rem, 8vw, 6rem);
  letter-spacing: 6px;
  color: ${colors.textPrimary};
  font-family: monospace;
`;

const Title = styled.h2`
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  color: ${colors.textPrimary};
`;

const Text = styled.p`
  font-size: 1.1rem;
  color: ${colors.textSecondary};
  margin-top: 1rem;
  line-height: 1.7;
`;

const Button = styled(Link)`
  margin-top: 2.5rem;
  padding: 0.9rem 3rem;
  background: ${colors.orange};
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
`;

/* 🟧 PIXEL BRAND */
function PixelBrand() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setExpanded(e => !e);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      <span
        style={{
          display: 'inline-block',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          width: expanded ? '10.5ch' : '2.5ch',
          transition: 'width 0.9s steps(10)',
        }}
      >
        {expanded ? 'Emergency' : 'E'}
      </span>

      <span
        style={{
          margin: '0 8px',
          opacity: expanded ? 0 : 1,
          transition: 'opacity 0.3s linear',
        }}
      >
        -
      </span>

      <span>PAY</span>
    </span>
  );
}

/* 🌿 MAIN */
export default function Landing() {
  const containerRef = useRef(null);
  const pathRef = useRef(null);
  const sectionRefs = useRef([]);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(Array(5).fill(false));

  useEffect(() => {
    const el = containerRef.current;
    const onScroll = () => {
      setProgress(el.scrollTop / (el.scrollHeight - el.clientHeight));
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const i = Number(e.target.dataset.index);
            setVisible(v => {
              const n = [...v];
              n[i] = true;
              return n;
            });
          }
        });
      },
      { threshold: 0.4 }
    );
    sectionRefs.current.forEach(s => s && observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const getBall = () => {
    if (!pathRef.current) return { x: 0, y: 0 };
    const len = pathRef.current.getTotalLength();
    return pathRef.current.getPointAtLength(len * progress);
  };

  const { x, y } = getBall();

  return (
    <ScrollContainer ref={containerRef}>
      <BackgroundLayer>
        <BlobOne size={420} color={colors.orange} duration={14} />
        <BlobTwo size={360} color={colors.yellow} duration={18} />
        <BlobThree size={300} color={colors.pink} duration={16} />
      </BackgroundLayer>

      <TrackWrapper>
        <svg width="140" height="100%" viewBox="0 0 140 1400">
          <path
            ref={pathRef}
            d="M20 0 L120 300 L20 600 L120 900 L70 1200"
            fill="none"
            stroke={colors.track}
            strokeWidth="4"
          />
          <circle cx={x} cy={y} r="15" fill={colors.orange} />
          <text x={x} y={y + 5} textAnchor="middle" fontSize="16" fill="white">₹</text>
        </svg>
      </TrackWrapper>

      {[scaleUp, slideRight, slideLeft, fadeUp, scaleUp].map((anim, i) => (
        <Section key={i} ref={el => sectionRefs.current[i] = el} data-index={i}>
          <AnimatedContent visible={visible[i]} animation={anim}>
            {i === 0 && (
              <>
                <Brand><PixelBrand /></Brand>
                <Text>Emergency care first. Payment handled later.</Text>
                <Button to="/login">Login</Button>
              </>
            )}
            {i === 1 && (
              <>
                <Title>Emergencies Don’t Wait</Title>
                <Text>Financial delays should never delay care.</Text>
              </>
            )}
            {i === 2 && (
              <>
                <Title>How E-PAY Works</Title>
                <Text>Instant credit so treatment starts immediately.</Text>
              </>
            )}
            {i === 3 && (
              <>
                <Title>Built on Trust</Title>
                <Text>Verified hospitals and secure workflows.</Text>
              </>
            )}
            {i === 4 && (
              <>
                <Title>Start with E-PAY</Title>
                <Text>Because medical care should never wait.</Text>
                <Button to="/login">Get Started</Button>
              </>
            )}
          </AnimatedContent>
        </Section>
      ))}
    </ScrollContainer>
  );
}
