import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import blackchalkTreeshake from './scripts/blackchalk-treeshake.mjs';
import securityHeaders from './scripts/security-headers.mjs';

export default defineConfig({
  integrations: [react(), securityHeaders()],
  vite: { plugins: [blackchalkTreeshake()] },
  output: 'static',
  security: {
    csp: {
      directives: ["default-src 'self'", "connect-src 'self' https://cloudflareinsights.com", "object-src 'none'", "base-uri 'self'", "form-action 'self'"],
      scriptDirective: { resources: ["'self'", 'https://static.cloudflareinsights.com/beacon.min.js'] },
    },
  },
  trailingSlash: 'never',
  build: { format: 'file' },
});
