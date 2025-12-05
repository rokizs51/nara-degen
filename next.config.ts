/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  // Disable Gzip (let Cloudflare handle it to save VM CPU)
  compress: false,

  // Good for security
  poweredByHeader: false,

  // Essential for self-hosting to prevent CPU spikes
  images: {
    unoptimized: true,
  },

  // NOTE: No 'env' block needed. 
  // Next.js automatically detects NEXT_PUBLIC_ variables during 'npm run build'
};

export default nextConfig;