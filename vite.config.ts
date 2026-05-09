import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [

    tanstackStart({
      server: { entry: "src/server.ts" },
      deployment: "cloudflare-pages",
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
    {
      name: "cloudflare-pages-adapter",
      apply: "build",
      closeBundle: async () => {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const serverDir = path.resolve(".output/server");
        const outputDir = path.resolve(".output");
        const clientDir = path.resolve(".output/client");
        
        // Create a _worker.js wrapper to handle static assets, environment variables, and SSR
        if (fs.existsSync(path.join(serverDir, "server.js"))) {
          const workerContent = `
import handler from './server.js';

export default {
  async fetch(request, env, ctx) {
    // Globalize environment variables for libraries that expect process.env
    globalThis.process = globalThis.process || { env: {} };
    Object.assign(globalThis.process.env, env);

    const url = new URL(request.url);
    
    // Try to serve static assets first
    if (url.pathname.startsWith('/assets/') || url.pathname.includes('.')) {
      try {
        const res = await env.ASSETS.fetch(request);
        if (res.status !== 404) return res;
      } catch (e) {
        console.error('Static asset error:', e);
      }
    }
    
    // Fallback to TanStack Start handler
    return handler.fetch(request, env, ctx);
  }
};
`;
          fs.writeFileSync(path.join(outputDir, "_worker.js"), workerContent);
          fs.copyFileSync(path.join(serverDir, "server.js"), path.join(outputDir, "server.js"));
          console.log("Created _worker.js wrapper with env globalization");
        }
        
        // Merge assets: Copy from server/assets and client/assets to .output/assets
        const targetAssetsDir = path.join(outputDir, "assets");
        if (!fs.existsSync(targetAssetsDir)) fs.mkdirSync(targetAssetsDir, { recursive: true });
        
        [path.join(serverDir, "assets"), path.join(clientDir, "assets")].forEach(dir => {
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
              fs.copyFileSync(path.join(dir, file), path.join(targetAssetsDir, file));
            }
          }
        });
        
        // Copy other files from client root (like index.html, robots.txt etc)
        if (fs.existsSync(clientDir)) {
          const files = fs.readdirSync(clientDir);
          for (const file of files) {
            if (file === "assets") continue;
            const src = path.join(clientDir, file);
            const dest = path.join(outputDir, file);
            if (fs.statSync(src).isDirectory()) {
              fs.cpSync(src, dest, { recursive: true });
            } else {
              fs.copyFileSync(src, dest);
            }
          }
        }
        console.log("Assets merged and infrastructure stabilized in .output");
      }
    }
  ],
  build: {
    outDir: ".output",
  },
  server: {
    host: "::",
    port: 8080,
  },
});
