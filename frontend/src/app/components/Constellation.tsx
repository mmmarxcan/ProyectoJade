import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface ConstellationProps {
  isActive: boolean;
}

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  pulseSpeed: number;
  isTemporary?: boolean; // Para estrellas creadas por clics
  life?: number;
}

export default function Constellation({ isActive }: ConstellationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const maxStars = 80;
    const connectionDist = 120; // Distancia para conectar estrellas
    const mouseConnectionDist = 180; // Distancia para conectar el mouse

    // Ajustar tamaño
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Inicializar estrellas principales
    const initialStars: Star[] = [];
    for (let i = 0; i < maxStars; i++) {
      initialStars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        alpha: Math.random(),
        pulseSpeed: 0.005 + Math.random() * 0.015,
      });
    }
    starsRef.current = initialStars;

    // Seguimiento del mouse
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = null;
    };

    // Crear partículas en el click
    const handleCanvasClick = (e: MouseEvent) => {
      const clickX = e.clientX;
      const clickY = e.clientY;
      
      const burstCount = 12;
      const newStars: Star[] = [];
      
      for (let i = 0; i < burstCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        newStars.push({
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 1,
          alpha: 1.0,
          pulseSpeed: 0, // No parpadea, decae por vida
          isTemporary: true,
          life: 1.0 // 100% de vida inicial
        });
      }
      
      starsRef.current = [...starsRef.current, ...newStars];
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleCanvasClick);

    // Bucle de animación
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fondo oscuro
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;
      const currentStars = starsRef.current;

      // Filtrar estrellas temporales que ya expiraron
      starsRef.current = currentStars.filter(star => {
        if (star.isTemporary) {
          return (star.life ?? 0) > 0.05;
        }
        return true;
      });

      // Actualizar y dibujar estrellas
      starsRef.current.forEach((star) => {
        star.x += star.vx;
        star.y += star.vy;

        // Rebotar en los bordes
        if (star.x < 0 || star.x > canvas.width) star.vx *= -1;
        if (star.y < 0 || star.y > canvas.height) star.vy *= -1;

        if (star.isTemporary) {
          // Decaimiento de estrellas por click
          star.life = (star.life ?? 1.0) - 0.02;
          star.alpha = star.life;
          star.vx *= 0.96; // Fricción
          star.vy *= 0.96;
        } else {
          // Parpadeo de estrellas estables
          star.alpha += star.pulseSpeed;
          if (star.alpha > 1.0 || star.alpha < 0.2) {
            star.pulseSpeed *= -1;
          }
        }

        // Dibujar estrella con brillo neón
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.isTemporary 
          ? `rgba(232, 160, 191, ${star.alpha})` // Rosa para explosión de clicks
          : `rgba(16, 185, 129, ${star.alpha})`; // Verde esmeralda neón de fondo
        
        if (star.isTemporary) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#e8a0bf";
        } else {
          ctx.shadowBlur = 6;
          ctx.shadowColor = "#10b981";
        }
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      });

      // Dibujar líneas entre estrellas
      for (let i = 0; i < starsRef.current.length; i++) {
        for (let j = i + 1; j < starsRef.current.length; j++) {
          const s1 = starsRef.current[i];
          const s2 = starsRef.current[j];

          const dx = s1.x - s2.x;
          const dy = s1.y - s2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.15 * Math.min(s1.alpha, s2.alpha);
            ctx.strokeStyle = s1.isTemporary || s2.isTemporary
              ? `rgba(232, 160, 191, ${alpha})`
              : `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();
          }
        }
      }

      // Conectar estrellas al mouse (interacción activa)
      if (mouse) {
        starsRef.current.forEach((star) => {
          const dx = star.x - mouse.x;
          const dy = star.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouseConnectionDist) {
            const alpha = (1 - dist / mouseConnectionDist) * 0.35 * star.alpha;
            
            // Efecto de línea brillante hacia el puntero
            const gradient = ctx.createLinearGradient(star.x, star.y, mouse.x, mouse.y);
            gradient.addColorStop(0, `rgba(16, 185, 129, ${alpha})`);
            gradient.addColorStop(1, `rgba(232, 160, 191, ${alpha * 0.5})`);
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        });
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("click", handleCanvasClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="fixed inset-0 pointer-events-auto z-0 cursor-crosshair"
    >
      <canvas ref={canvasRef} className="w-full h-full block bg-zinc-950" />
      {/* Indicación flotante interactiva */}
      <div className="absolute bottom-6 right-6 text-zinc-500 font-mono text-xs pointer-events-none select-none">
        [Haz click en la pantalla para sembrar estrellas]
      </div>
    </motion.div>
  );
}
