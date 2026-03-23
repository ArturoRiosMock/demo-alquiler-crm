import type { NextConfig } from "next";
import path from "path";

// Ruta absoluta explícita del proyecto
const projectRoot = "C:\\Users\\User\\DemoAlquiler";

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
