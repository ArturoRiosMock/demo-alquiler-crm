import type { NextConfig } from "next";

// Raíz del proyecto en el entorno actual (Vercel/Linux y Windows local).
// Una ruta fija tipo C:\... rompe el build o Turbopack fuera de tu máquina.
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
