/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: `npm run build` emits a fully static site to `out/`, which
  // the FastAPI backend serves on port 8000.
  output: "export",
  // Emit every route as `<route>/index.html` so FastAPI's StaticFiles can serve
  // deep links (e.g. /creator/) and reloads without extra routing.
  trailingSlash: true,
};

export default nextConfig;
