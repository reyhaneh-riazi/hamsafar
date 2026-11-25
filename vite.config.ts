import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import { defineConfig, type Plugin } from "vite";

const root = import.meta.dirname;
const publicDir = path.resolve(root, "public");

const MIME: Record<string, string> = {
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function publicFileToDataUri(publicPath: string): string | null {
  const file = path.join(publicDir, publicPath.replace(/^\.?\//, ""));
  const mime = MIME[path.extname(file).toLowerCase()];
  if (!mime || !file.startsWith(publicDir) || !existsSync(file)) return null;
  return `data:${mime};base64,${readFileSync(file).toString("base64")}`;
}

function inlinePublicAssets(): Plugin {
  const ref =
    /(url\(\s*['"]?|href=["'])(\.?\/(?:fonts|images)\/[\w.\-/]+|\.?\/favicon\.svg)/g;
  const inline = (text: string) =>
    text.replace(ref, (match, prefix: string, publicPath: string) => {
      const data = publicFileToDataUri(publicPath);
      return data ? `${prefix}${data}` : match;
    });

  return {
    name: "hamsafar:inline-public-assets",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== "asset" || typeof file.source !== "string") continue;
        if (file.fileName.endsWith(".html")) {
          file.source = inline(
            file.source.replace(
              /\s*<link rel="preload"[^>]*\/fonts\/[^>]*>/g,
              "",
            ),
          );
        } else if (file.fileName.endsWith(".css")) {
          file.source = inline(file.source);
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const standalone = mode === "standalone";

  return {
    base: "/",
    plugins: [
      react(),
      tailwindcss(),
      ...(standalone
        ? [
            inlinePublicAssets(),
            viteSingleFile({ removeViteModuleLoader: true }),
          ]
        : []),
    ],
    publicDir: standalone ? false : "public",
    resolve: {
      alias: {
        "@": path.resolve(root, "./src"),
      },
    },
    server: {
      port: 3000,
      host: true,
      proxy: {
        "/api": {
          target: "https://website-api.liara.run",
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("origin", "http://website-api.liara.run");
              proxyReq.setHeader("referer", "http://website-api.liara.run/");
            });
          },
        },
        "/media": {
          target: "https://website-api.liara.run",
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("origin", "http://website-api.liara.run");
              proxyReq.setHeader("referer", "http://website-api.liara.run/");
            });
          },
        },
      },
    },
    preview: {
      port: 4173,
    },
    build: {
      target: "es2022",
      sourcemap: false,
      outDir: standalone ? "dist-standalone" : "dist",
      emptyOutDir: true,
    },
  };
});
