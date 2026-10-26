import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const appRoutes = [
  "login",
  "change-password",
  "employees",
  "attendance",
  "leaves",
  "payroll",
  "organization",
  "ai",
  "announcements",
  "audit",
];

function routeEntryPages() {
  return {
    name: "route-entry-pages",
    enforce: "post",
    generateBundle(_, bundle) {
      const indexHtml = bundle["index.html"];
      if (!indexHtml || indexHtml.type !== "asset") {
        throw new Error("Unable to generate route pages: index.html was not built.");
      }

      for (const route of appRoutes) {
        this.emitFile({
          type: "asset",
          fileName: `${route}/index.html`,
          source: indexHtml.source,
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), routeEntryPages()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
  },
});
