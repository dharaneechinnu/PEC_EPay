import React, { useEffect, useState } from "react";
import axios from "axios";

const VerifierLoginDash = () => {
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line
  }, [onlyActive]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line
  }, [items, search]);

  // Replace your current fetchItems with this function:
const fetchItems = async () => {
  setLoading(true);
  setError("");

  try {
    // POST request sending JSON body like Postman:
    const res = await axios.get('http://localhost:3500/verifier/getallscholarships');
    // handle possible response shapes
    if (Array.isArray(res.data)) {
      setItems(res.data);
    } else if (res.data && Array.isArray(res.data.data)) {
      setItems(res.data.data);
    } else if (res.data && res.data.items && Array.isArray(res.data.items)) {
      setItems(res.data.items);
    } else {
      // fallback: try to find array inside res.data
      const foundArray = Object.values(res.data || {}).find((v) => Array.isArray(v));
      setItems(foundArray || []);
    }
  } catch (err) {
    console.error("fetchItems error:", err);
    // show a helpful message (include server message if present)
    const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
    setError(serverMsg || "Failed to fetch records. Check server or endpoint.");
  } finally {
    setLoading(false);
  }
};


  // If your backend expects POST with JSON body: uncomment and replace fetchItems with this:
  // const fetchItems = async () => {
  //   setLoading(true); setError("");
  //   try {
  //     const res = await axios.post("http://localhost:3500/admin/scholars", { onlyActive: onlyActive ? "true" : "false" });
  //     setItems(Array.isArray(res.data) ? res.data : []);
  //   } catch (err) {
  //     console.error(err); setError("Failed to fetch records."); 
  //   } finally { setLoading(false); }
  // };

  const applyFilters = () => {
    const q = search.trim().toLowerCase();
    if (!q) return setFiltered(items);
    setFiltered(
      items.filter((it) => {
        const name = (it.scholarshipName || it.name || "").toString().toLowerCase();
        const provider = (it.providerName || "").toString().toLowerCase();
        return name.includes(q) || provider.includes(q);
      })
    );
  };

  const toggleOnlyActive = () => setOnlyActive((p) => !p);

  const prettyDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  // Canvas animation: reusable and optimized
  useEffect(() => {
    const canvas = document.getElementById("verifier-bg");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles = [];
    const NUM = 70;
    let rafId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    class P {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.r = Math.random() * 2 + 0.6;
        this.vx = (Math.random() - 0.5) * 1.1;
        this.vy = (Math.random() - 0.5) * 1.1;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = "#00eaff";
        ctx.fill();
      }
    }

    particles = Array.from({ length: NUM }, () => new P());

    const connect = () => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.strokeStyle = "rgba(0,210,255,0.14)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      connect();
      rafId = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style>{`
        /* Page + theme */
        .verifier-root { position: relative; min-height: 100vh; font-family: 'Poppins', sans-serif; background: radial-gradient(circle at center, #001a35, #000817); color: #fff; padding: 34px 18px; box-sizing: border-box; overflow: hidden; }
        #verifier-bg { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; }
        .wrap { position: relative; z-index: 1; width: 1100px; max-width: calc(100% - 40px); margin: 0 auto; }

        /* Header */
        .head { display:flex; justify-content: space-between; align-items:center; gap: 12px; margin-bottom: 18px; }
        .title { font-size: 24px; font-weight: 700; background: linear-gradient(90deg,#00cfff,#ffffff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .controls { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

        .search { min-width:220px; padding:10px 12px; border-radius:10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color:#fff; outline:none; }
        .search::placeholder { color: #bfeff7; opacity:0.7; }

        .toggle { display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:10px; cursor:pointer; background: linear-gradient(90deg, rgba(0,207,255,0.06), rgba(0,120,255,0.03)); border: 1px solid rgba(0,207,255,0.14); }
        .toggle .pill { padding: 6px 8px; border-radius:8px; font-weight:700; }

        .refresh { padding: 8px 12px; border-radius:10px; background: rgba(255,255,255,0.03); border: 1px solid rgba(0,207,255,0.06); color:#bff9ff; cursor:pointer; }

        /* Container + grid */
        .container { padding: 18px; border-radius: 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
        .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-top: 14px; }

        .card { padding:14px; border-radius:12px; background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.00)); border:1px solid rgba(0,207,255,0.06); box-shadow: 0 6px 18px rgba(0,0,0,0.45); display:flex; flex-direction:column; gap:8px; min-height:120px; }
        .card h3 { margin:0; font-size:16px; color:#e7ffff; }
        .meta { display:flex; justify-content:space-between; gap:8px; color:#bfeff7; font-size:13px; align-items:center; }
        .badge { padding:6px 8px; border-radius:999px; font-weight:700; font-size:12px; }
        .active { background: linear-gradient(90deg,#00e6ff,#00b0ff); color:#022; }
        .inactive { background: rgba(255,255,255,0.04); color:#bfeff7; border:1px solid rgba(255,255,255,0.02); }

        .desc { color:#bfeff7; font-size:13px; margin-top:6px; flex:1; overflow:hidden; text-overflow:ellipsis; }
        .metaSmall { font-size:12px; color:#9fdff6; }

        .actions { display:flex; gap:8px; margin-top:10px; }
        .btn { padding:8px 10px; border-radius:8px; border:none; cursor:pointer; font-weight:700; }
        .view { background: linear-gradient(90deg,#00cfff,#007bff); color:#fff; }
        .manage { background: rgba(255,255,255,0.03); color:#bff9ff; border:1px solid rgba(0,207,255,0.06); }

        .empty { text-align:center; padding:40px 0; color:#a9dfe8; }

        @media (max-width: 680px) {
          .wrap { width: 96%; }
          .head { flex-direction: column; align-items:flex-start; gap:10px; }
        }
      `}</style>

      <div className="verifier-root">
        <canvas id="verifier-bg"></canvas>

        <div className="wrap">
          <div className="head">
            <div className="title">Verifier Dashboard</div>

            <div className="controls">
              <input
                className="search"
                placeholder="Search scholarship or provider..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <div className="toggle" onClick={toggleOnlyActive} title="Toggle onlyActive">
                <div style={{ fontSize: 13 }}>{onlyActive ? "Only Active" : "All"}</div>
                <div className="pill" style={{ background: onlyActive ? "linear-gradient(90deg,#00e6ff,#00b0ff)" : "transparent", color: onlyActive ? "#022" : "#bff9ff" }}>
                  {onlyActive ? "ON" : "OFF"}
                </div>
              </div>

              <button className="refresh" onClick={fetchItems}>Refresh</button>
            </div>
          </div>

          <div className="container">
            {loading ? (
              <div className="empty">Loading records...</div>
            ) : error ? (
              <div className="empty">{error}</div>
            ) : (filtered.length === 0) ? (
              <div className="empty">No records found.</div>
            ) : (
              <div className="grid">
                {filtered.map((it) => (
                  <div className="card" key={it._id || it.id || Math.random()}>
                    <h3>{it.scholarshipName || it.name || "Untitled"}</h3>

                    <div className="meta">
                      <div className="metaSmall">{it.providerName || "Provider unknown"}</div>
                      <div className={`badge ${it.isActive ? "active" : "inactive"}`}>{it.isActive ? "Active" : "Inactive"}</div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 8 }}>
                      <div>
                        <div className="metaSmall">Amount</div>
                        <div style={{ fontWeight: 800, color: "#e6ffff" }}>₹ {it.scholarshipAmount ?? it.amount ?? "-"}</div>
                      </div>

                      <div>
                        <div className="metaSmall">Deadline</div>
                        <div style={{ fontWeight: 700, color: "#e6ffff" }}>{prettyDate(it.applicationDeadline)}</div>
                      </div>
                    </div>

                    <div className="desc">{(it.description || it.eligibilityCriteria || "No description available.").slice(0, 220)}</div>

                    <div className="actions">
                      <button className="btn view" onClick={() => window.open(`/Verifier/scholar/${it._id}`, "_blank")}>View</button>
                      <button className="btn manage" onClick={() => alert("Implement verify/manage action")}>Manage</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifierLoginDash;
