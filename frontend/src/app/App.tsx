import { useState, useEffect, useRef, useCallback } from "react";
import Constellation from "./components/Constellation";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  shape: "circle" | "rect" | "heart";
  opacity: number;
  life: number;
}

interface Petal {
  id: number;
  x: number;
  y: number;
  scale: number;
  delay: number;
  duration: number;
  color: string;
  angle: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#E8A0BF", "#F5D5CB", "#C9B8E8", "#A8D8EA",
  "#FAE3B4", "#B5EAD7", "#FFDAC1", "#E2F0CB",
];

const PETAL_COLORS = [
  "#F9C6D0", "#FCD9E5", "#E8C7E8", "#C9E8F0",
  "#FDE8C8", "#D4EDD8",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function FloatingPetals({ active }: { active: boolean }) {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    if (!active) return;
    const newPetals: Petal[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      y: 100,
      scale: 0.4 + Math.random() * 0.8,
      delay: Math.random() * 1.2,
      duration: 3.5 + Math.random() * 2,
      color: PETAL_COLORS[i % PETAL_COLORS.length],
      angle: -60 + Math.random() * 120,
    }));
    setPetals(newPetals);
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `petalFloat ${p.duration}s ease-out ${p.delay}s forwards`,
            "--tx": `${Math.sin((p.angle * Math.PI) / 180) * 120}px`,
            "--ty": `-${280 + Math.random() * 200}px`,
            "--rot": `${p.angle * 3}deg`,
          } as React.CSSProperties}
        >
          <svg
            width={`${20 * p.scale}`}
            height={`${20 * p.scale}`}
            viewBox="0 0 20 20"
          >
            <ellipse
              cx="10" cy="10" rx="5" ry="9"
              fill={p.color}
              style={{ transform: "rotate(-20deg)", transformOrigin: "center" }}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

function ConfettiCanvas({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  const spawnConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.45;

    const batch: Particle[] = Array.from({ length: 80 }, (_, i) => {
      const angle = (Math.random() * Math.PI * 2);
      const speed = 4 + Math.random() * 9;
      return {
        id: Date.now() + i,
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 5 + Math.random() * 6,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        shape: (["circle", "rect", "heart"] as const)[Math.floor(Math.random() * 3)],
        opacity: 1,
        life: 1,
      };
    });
    particlesRef.current = [...particlesRef.current, ...batch];
  }, []);

  useEffect(() => {
    if (trigger === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    spawnConfetti();
    setTimeout(spawnConfetti, 180);
    setTimeout(spawnConfetti, 380);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter((p) => p.opacity > 0.02);

      particlesRef.current.forEach((p) => {
        p.vy += 0.28;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          const s = p.size / 10;
          ctx.beginPath();
          ctx.moveTo(0, s * 3);
          ctx.bezierCurveTo(-s * 5, -s, -s * 10, s * 2, 0, s * 7);
          ctx.bezierCurveTo(s * 10, s * 2, s * 5, -s, 0, s * 3);
          ctx.fill();
        }
        ctx.restore();
      });

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trigger, spawnConfetti]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-20"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

function BloomBackground({ phase }: { phase: "idle" | "message" | "yes" | "no" }) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div
        className="absolute inset-0 transition-all duration-1000"
        style={{
          background:
            phase === "yes"
              ? "radial-gradient(ellipse at 50% 60%, #0c0a09 0%, #18181b 60%, #09090b 100%)" // Dark Cyberpunk
              : phase === "no"
              ? "radial-gradient(ellipse at 50% 60%, #EEF0FD 0%, #F4F6FD 35%, #FDF8F3 70%)"
              : phase === "message"
              ? "radial-gradient(ellipse at 50% 60%, #18181b 0%, #09090b 100%)"
              : "radial-gradient(ellipse at 50% 60%, #FFF3EA 0%, #FDF8F3 60%)",
        }}
      />

      {/* Soft orb 1 */}
      <div
        className="absolute rounded-full blur-3xl transition-all duration-1500"
        style={{
          width: phase === "yes" ? "520px" : "320px",
          height: phase === "yes" ? "520px" : "320px",
          background:
            phase === "yes"
              ? "radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)" // Emerald Glow
              : "radial-gradient(circle, rgba(232,160,191,0.18) 0%, transparent 70%)",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          transitionDuration: "1200ms",
        }}
      />

      {/* Soft orb 2 */}
      <div
        className="absolute rounded-full blur-3xl transition-all duration-1500"
        style={{
          width: phase === "yes" ? "380px" : "200px",
          height: phase === "yes" ? "380px" : "200px",
          background:
            phase === "yes"
              ? "radial-gradient(circle, rgba(232,160,191,0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(201,184,232,0.12) 0%, transparent 70%)",
          bottom: "15%",
          right: "5%",
          transitionDuration: "1400ms",
        }}
      />

      {/* Decorative dots grid - top right */}
      <svg className="absolute top-6 right-6 opacity-20" width="80" height="80" viewBox="0 0 80 80">
        {[0, 16, 32, 48, 64].map((x) =>
          [0, 16, 32, 48, 64].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill={phase === "yes" ? "#10b981" : "#C9A08A"} />
          ))
        )}
      </svg>

      {/* Decorative dots - bottom left */}
      <svg className="absolute bottom-10 left-6 opacity-15" width="60" height="60" viewBox="0 0 60 60">
        {[0, 15, 30, 45].map((x) =>
          [0, 15, 30, 45].map((y) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill={phase === "yes" ? "#10b981" : "#C9A08A"} />
          ))
        )}
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase] = useState<"idle" | "message" | "yes" | "no">("idle");
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [noCount, setNoCount] = useState(0);
  const [noLabel, setNoLabel] = useState("No");
  const [customMessage, setCustomMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const noRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const NO_LABELS = [
    "No",
    "¿Estás segura? 🥺",
    "Piénsalo otra vez... 💔",
    "¿De verdad? 😭",
    "Mmm, ¿tal vez? 🤔",
    "¡Última oportunidad! ⚠️",
    "Por favooor... 🙏",
    "¡Di que sí! 💕",
  ];

  const evadeNo = useCallback(() => {
    if (phase === "yes" || phase === "message") return;
    const btn = noRef.current;
    if (!btn) return;

    const pad = 12;
    const maxDelta = 130;
    const btnW = btn.offsetWidth;
    const btnH = btn.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Si es la primera evasión, empezamos desde la posición actual del botón en el viewport
    const btnRect = btn.getBoundingClientRect();
    const current = noCount > 0
      ? { x: noPos.x, y: noPos.y }
      : { x: btnRect.left, y: btnRect.top };

    let nx = current.x + (Math.random() * 2 - 1) * maxDelta;
    let ny = current.y + (Math.random() * 2 - 1) * maxDelta;

    // Clamp estricto al viewport — nunca puede salirse de la pantalla
    nx = Math.max(pad, Math.min(nx, vw - btnW - pad));
    ny = Math.max(pad, Math.min(ny, vh - btnH - pad));

    setNoPos({ x: Math.round(nx), y: Math.round(ny) });

    const next = noCount + 1;
    setNoCount(next);
    setNoLabel(NO_LABELS[Math.min(next, NO_LABELS.length - 1)]);
    setPhase("no");
  }, [noCount, phase, noPos]);

  // Reajustar si cambia el tamaño de ventana para que nunca quede fuera
  useEffect(() => {
    const onResize = () => {
      const btn = noRef.current;
      if (!btn || noCount === 0) return;
      const pad = 12;
      const maxX = window.innerWidth - btn.offsetWidth - pad;
      const maxY = window.innerHeight - btn.offsetHeight - pad;
      setNoPos((pos) => ({
        x: Math.max(pad, Math.min(pos.x, maxX)),
        y: Math.max(pad, Math.min(pos.y, maxY)),
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [noCount]);

  const handleYes = () => {
    setPhase("message");
  };

  const handleConfirmResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setDbError(null);

    try {
      const res = await fetch(`${apiUrl}/api/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accepted: true,
          message: customMessage.trim() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error en el servidor backend.");
      }
    } catch (err: any) {
      console.error("Error al guardar respuesta a través del backend:", err);
      setDbError(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
      setPhase("yes");
      setConfettiTrigger((t) => t + 1);
    }
  };

  const handleReset = () => {
    setPhase("idle");
    setNoPos({ x: 0, y: 0 });
    setNoCount(0);
    setNoLabel("No");
    setCustomMessage("");
    setDbError(null);
  };

  const yesMessage =
    noCount === 0
      ? "¡SÍ! Mi corazón está dando volteretas ahora mismo 🎉"
      : noCount <= 3
      ? "¡Sabía que dirías que sí! Me tenías con nervios ✨"
      : "Después de tanto perseguir ese botón... ¡valió totalmente la pena! 💕";

  return (
    <>
      <style>{`
        @keyframes petalFloat {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.18); }
          30% { transform: scale(1); }
          45% { transform: scale(1.12); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .anim-fade-up { animation: fadeSlideUp 0.6s ease both; }
        .anim-heartbeat { animation: heartbeat 1.4s ease infinite; }
        .anim-float { animation: floatY 3s ease-in-out infinite; }
        .btn-yes-shimmer {
          background: linear-gradient(105deg, #E8A0BF 0%, #f0b8d0 40%, #e8c4d8 50%, #E8A0BF 60%, #d490af 100%);
          background-size: 200% auto;
        }
        .btn-yes-shimmer:hover {
          animation: shimmer 1.2s linear infinite;
        }
        .btn-cyber-shimmer {
          background: linear-gradient(105deg, #10b981 0%, #34d399 40%, #a7f3d0 50%, #10b981 60%, #059669 100%);
          background-size: 200% auto;
        }
        .btn-cyber-shimmer:hover {
          animation: shimmer 1.2s linear infinite;
        }
        .no-btn-abs {
          position: fixed;
          z-index: 9999;
          transition: left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .no-btn-static {
          position: relative;
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      {/* Animación generativa de constelación en fase SÍ */}
      <Constellation isActive={phase === "yes"} />

      <BloomBackground phase={phase} />
      <ConfettiCanvas trigger={confettiTrigger} />
      <FloatingPetals active={phase === "yes"} />

      {/* Full viewport container */}
      <div
        ref={containerRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 py-16"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        {/* Card */}
        <div
          className="relative w-full max-w-sm mx-auto z-10"
          style={{ animation: "fadeSlideUp 0.7s ease both" }}
        >
          <div
            ref={cardRef}
            className={`relative rounded-3xl shadow-sm overflow-hidden transition-colors duration-1000 ${
              phase === "yes" 
                ? "bg-zinc-950/90 text-white border-emerald-500/30" 
                : "bg-card text-foreground"
            }`}
            style={{
              borderWidth: "1.5px",
              borderColor: phase === "yes" ? "rgba(16, 185, 129, 0.3)" : "rgba(232, 160, 191, 0.3)",
              boxShadow:
                phase === "yes"
                  ? "0 4px 40px rgba(16, 185, 129, 0.15), 0 1px 4px rgba(0, 0, 0, 0.5)"
                  : "0 4px 40px rgba(232, 160, 191, 0.15), 0 1px 4px rgba(61, 43, 31, 0.06)",
            }}
          >
            {/* Top strip */}
            <div
              className="h-2 w-full transition-all duration-1000"
              style={{
                background: phase === "yes"
                  ? "linear-gradient(90deg, #10b981, #34d399, #6ee7b7)"
                  : "linear-gradient(90deg, #E8A0BF, #C9B8E8, #FAE3B4)",
              }}
            />

            <div className="px-8 pt-10 pb-8 flex flex-col items-center gap-0">
              {/* Emoji / icon */}
              {phase === "yes" ? (
                <div className="anim-heartbeat mb-2">
                  <span style={{ fontSize: "60px", lineHeight: 1 }}>💖</span>
                </div>
              ) : phase === "message" ? (
                <div className="anim-float mb-2">
                  <span style={{ fontSize: "54px", lineHeight: 1 }}>✍️</span>
                </div>
              ) : (
                <div className="anim-float mb-2">
                  <span style={{ fontSize: "54px", lineHeight: 1 }}>🌸</span>
                </div>
              )}

              {/* Main message */}
              {phase === "idle" || phase === "no" ? (
                <div className="text-center mt-4 mb-2 w-full">
                  <h1
                    className="text-3xl leading-snug tracking-tight"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontStyle: "italic",
                      color: "#3D2B1F",
                    }}
                  >
                    ¿Quieres ser
                    <br />
                    <span
                      style={{
                        background: "linear-gradient(90deg, #E8A0BF, #C9A0E0)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        fontStyle: "normal",
                        fontWeight: 500,
                      }}
                    >
                      mi novia?
                    </span>
                  </h1>
                  {noCount > 0 && (
                    <p
                      className="mt-3 text-sm"
                      style={{ color: "#9A7B6E", animation: "fadeSlideUp 0.4s ease both" }}
                    >
                      {noCount === 1 && "El botón parece un poco tímido..."}
                      {noCount === 2 && "¡Realmente no quiere ser atrapado!"}
                      {noCount >= 3 && noCount < 6 && "¿Sigues huyendo? Qué valiente."}
                      {noCount >= 6 && "Tienes buena resistencia, te lo concedo."}
                    </p>
                  )}
                </div>
              ) : phase === "message" ? (
                <div className="text-center mt-4 mb-2 w-full anim-fade-up">
                  <h1
                    className="text-2xl font-bold font-mono text-emerald-400 mb-2"
                  >
                    [CONEXIÓN_ESTABLECIDA]
                  </h1>
                  <p className="text-sm text-zinc-400 font-mono mb-4">
                    Ingresa un mensaje especial opcional para el registro de nuestro compromiso:
                  </p>
                </div>
              ) : (
                <div className="text-center mt-4 mb-2 anim-fade-up">
                  <h1
                    className="text-2xl leading-snug"
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontStyle: "italic",
                      color: "#10b981",
                    }}
                  >
                    {yesMessage}
                  </h1>
                  <p className="mt-3 text-sm text-zinc-400 font-mono">
                    Constelaciones e interacción activadas.
                  </p>
                  
                  {customMessage.trim() && (
                    <div className="mt-4 p-3 bg-zinc-900/60 border border-emerald-500/20 rounded-xl text-left font-mono text-xs text-emerald-400/90 max-h-32 overflow-y-auto">
                      <div className="text-[10px] text-zinc-500 mb-1">[MENSAJE_REGISTRADO]:</div>
                      "{customMessage}"
                    </div>
                  )}

                  {dbError && (
                    <p className="mt-2 text-[10px] text-red-400 font-mono">
                      (Nota: No se pudo guardar en la BD, pero el compromiso es real ✨)
                    </p>
                  )}
                </div>
              )}

              {/* Divider */}
              <div
                className="w-16 my-6 rounded-full transition-colors duration-1000"
                style={{ 
                  height: "1.5px", 
                  background: phase === "yes" ? "rgba(16, 185, 129, 0.35)" : "rgba(232, 160, 191, 0.35)" 
                }}
              />

              {/* Buttons area */}
              {phase === "idle" || phase === "no" ? (
                <div
                  ref={containerRef}
                  className="relative w-full flex flex-col items-center gap-4"
                  style={{ minHeight: "120px" }}
                >
                  {/* Yes button */}
                  <button
                    onClick={handleYes}
                    className="btn-yes-shimmer w-full py-3.5 rounded-2xl font-semibold text-white tracking-wide transition-transform active:scale-95 cursor-pointer"
                    style={{
                      fontSize: "1rem",
                      letterSpacing: "0.04em",
                      boxShadow: "0 6px 24px rgba(232, 160, 191, 0.45)",
                    }}
                  >
                    ¡Sí, totalmente! ✨
                  </button>

                  {/* No button — static initially, absolute after first evasion */}
                  <button
                    ref={noRef}
                    onClick={evadeNo}
                    onMouseEnter={evadeNo}
                    className={`${noCount > 0 ? "no-btn-abs" : "no-btn-static w-full"} py-3 px-8 rounded-2xl font-medium text-sm select-none cursor-pointer`}
                    style={{
                      color: "#9A7B6E",
                      background: "rgba(240,232,223,0.7)",
                      border: "1.5px solid rgba(180,140,120,0.2)",
                      ...(noCount > 0
                        ? {
                            left: `${noPos.x}px`,
                            top: `${noPos.y}px`,
                            width: "auto",
                            whiteSpace: "nowrap",
                          }
                        : {}),
                    }}
                  >
                    {noLabel}
                  </button>
                </div>
              ) : phase === "message" ? (
                <form onSubmit={handleConfirmResponse} className="w-full flex flex-col gap-4 anim-fade-up">
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Escribe algo bonito aquí..."
                    className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-white font-sans text-sm focus:outline-none focus:border-emerald-500 transition-colors h-20 resize-none"
                    maxLength={200}
                  />
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-cyber-shimmer w-full py-3 rounded-2xl font-semibold text-white tracking-wide transition-all duration-300 disabled:opacity-50 cursor-pointer text-sm shadow-[0_4px_16px_rgba(16,185,129,0.3)]"
                  >
                    {isSubmitting ? "GUARDANDO..." : "Confirmar e iniciar Constelación 🌌"}
                  </button>
                </form>
              ) : (
                <div className="w-full anim-fade-up">
                  <button
                    onClick={handleReset}
                    className="w-full py-3 rounded-2xl text-sm font-medium transition-colors hover:bg-zinc-900 text-zinc-400 bg-zinc-950 border border-zinc-800"
                  >
                    Preguntar otra vez
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Small note below card */}
          <p
            className={`text-center mt-6 text-xs transition-colors duration-1000 ${
              phase === "yes" ? "text-emerald-500/70" : "text-amber-700/50"
            }`}
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            {phase === "yes"
              ? "Hecho con amor y código interactivo 💌"
              : phase === "message"
              ? "Creando un registro imborrable..."
              : noCount === 0
              ? "Una pequeña pregunta con un gran corazón 💌"
              : "Pista: intenta atrapar el otro botón..."}
          </p>
        </div>
      </div>
    </>
  );
}

