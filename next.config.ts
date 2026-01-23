import type { NextConfig } from "next";

// ─────────────────────────────────────────────────────────────────────────────
// Mercado Pago Dynamic Environment Selection
// ─────────────────────────────────────────────────────────────────────────────

const isProduction = process.env.MP_USE_PRODUCTION === "true";

const mercadoPagoEnv = {
  NEXT_PUBLIC_MP_PUBLIC_KEY: isProduction
    ? process.env.MP_PROD_PUBLIC_KEY
    : process.env.MP_TEST_PUBLIC_KEY,
  MP_USE_PRODUCTION: process.env.MP_USE_PRODUCTION,
};

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔧 Next.js Config: Mercado Pago");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`   Modo: ${isProduction ? "🔴 PRODUÇÃO" : "🟢 TESTE"}`);
console.log(`   Public Key: ${mercadoPagoEnv.NEXT_PUBLIC_MP_PUBLIC_KEY?.substring(0, 25)}...`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

const nextConfig: NextConfig = {
  env: mercadoPagoEnv,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
