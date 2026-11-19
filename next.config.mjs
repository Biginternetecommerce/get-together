/** @type {import('next').NextConfig} */
const week = "public, max-age=604800, stale-while-revalidate=86400";
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    // videos / music / posters are big and never change between visits: let browsers and CDNs keep them for a week
    return [{ source: "/media/:path*", headers: [{ key: "Cache-Control", value: week }] }, { source: "/photos/:path*", headers: [{ key: "Cache-Control", value: week }] }];
  },
};
export default nextConfig;
