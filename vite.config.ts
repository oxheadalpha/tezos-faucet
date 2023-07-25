import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import Terminal from "vite-plugin-terminal"

import pkgJson from "./package.json"

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "build",
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  define: {
    global: "globalThis",
    "import.meta.env.APP_DESCRIPTION": JSON.stringify(pkgJson.description),
    "import.meta.env.APP_VERSION": JSON.stringify(pkgJson.version),
  },
  plugins: [react(), Terminal()],
  resolve: {
    alias: {
      http: "rollup-plugin-node-polyfills/polyfills/http",
      https: "rollup-plugin-node-polyfills/polyfills/http",
      stream: "rollup-plugin-node-polyfills/polyfills/stream",
      util: "rollup-plugin-node-polyfills/polyfills/util",
      zlib: "rollup-plugin-node-polyfills/polyfills/zlib",
      process: "rollup-plugin-node-polyfills/polyfills/process-es6",
      buffer: "rollup-plugin-node-polyfills/polyfills/buffer-es6",
    },
  },
})
