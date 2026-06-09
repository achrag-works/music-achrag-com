/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/((?!maintenance.html).*)',
        destination: '/maintenance.html',
        permanent: false,
      },
    ]
  },
}
export default nextConfig
