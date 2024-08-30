/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const nextConfig = {
  sassOptions: {
        includePaths: [path.join(__dirname, 'styles')],
      },
    images: {
        dangerouslyAllowSVG: true,
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'placehold.co',
            port:'',
          },
          {
            protocol: 'http',
            hostname: 'btraumullerportfoliocom.local',
            port:'',
          },
          {
              protocol: 'https',
              hostname: 'images.unsplash.com',
              port:''
            },
            {
              protocol: 'https',
              hostname: 'plus.unsplash.com',
              port:''
            }
        ]
        
      },
      reactStrictMode: false,
      
    
};

export default nextConfig;
