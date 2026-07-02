-- Esquema SQL para la base de datos de Proyecto Destino (Supabase / PostgreSQL)

-- 1. Crear la tabla para guardar las respuestas de la propuesta
CREATE TABLE IF NOT EXISTS public.responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    accepted BOOLEAN NOT NULL,                          -- TRUE si dice SÍ, FALSE si dice NO
    message TEXT,                                       -- Mensaje o dedicatoria opcional
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar la seguridad a nivel de fila (Row Level Security - RLS)
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas de acceso para mantener la base de datos segura

-- Política para permitir que cualquier persona (anónima) inserte una nueva respuesta.
-- Esto es lo que usará el frontend para registrar la decisión.
CREATE POLICY "Permitir inserción pública de respuestas" 
ON public.responses 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Política para permitir la lectura solo a usuarios autenticados (el administrador).
-- De este modo, nadie desde la consola del navegador podrá leer los mensajes de otras personas.
CREATE POLICY "Lectura restringida de respuestas" 
ON public.responses 
FOR SELECT 
TO authenticated 
USING (true);
