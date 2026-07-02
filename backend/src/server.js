const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de CORS - Se adapta según el entorno
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL || "http://localhost:3000"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(express.json());

// Servir archivos estáticos del frontend
const distPath = path.join(__dirname, "../../frontend/dist");

if (!fs.existsSync(distPath)) {
  console.error(`ERROR: No se encontró el directorio de frontend construido en ${distPath}.`);
  console.error("Ejecuta 'npm run build' en el frontend o el script de build del backend antes de iniciar.");
  process.exit(1);
}

app.use(express.static(distPath));

// Inicialización de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("tu-proyecto") || supabaseAnonKey.includes("tu-anon")) {
  console.warn(
    "ADVERTENCIA: Las variables de entorno de Supabase no están configuradas correctamente en backend/.env. " +
    "Por favor, actualiza tu archivo backend/.env con tu SUPABASE_URL y SUPABASE_ANON_KEY reales."
  );
}

const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder");

// Endpoint principal para guardar la respuesta de la propuesta
app.post("/api/responses", async (req, res) => {
  const { accepted, message } = req.body;

  if (accepted === undefined) {
    return res.status(400).json({ 
      success: false, 
      error: "El campo 'accepted' es requerido." 
    });
  }

  console.log(`[LOG]: Recibida respuesta de propuesta. Aceptado: ${accepted}, Mensaje: "${message || 'ninguno'}"`);

  try {
    const { data, error } = await supabase
      .from("responses")
      .insert([
        {
          accepted: accepted,
          message: message || null
        }
      ]);

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Respuesta guardada exitosamente en Supabase."
    });
  } catch (err) {
    console.error("Error al interactuar con Supabase:", err);
    return res.status(500).json({
      success: false,
      error: "Error interno al guardar en la base de datos."
    });
  }
});

// Endpoint de estado/salud para verificar que el servidor corre
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Servidor Express activo y listo." });
});

// Ruta raíz explícita para servir la aplicación
app.get("/", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Servir index.html para todas las rutas de SPA que no coinciden con otros endpoints
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`Servidor de Proyecto Destino iniciado con éxito.`);
  console.log(`Puerto: ${PORT}`);
  console.log(`URL local: http://localhost:${PORT}`);
  console.log(`===================================================`);
});
