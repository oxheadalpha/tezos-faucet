import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill"
import wasm from "vite-plugin-wasm"
import { resolve } from "path"
import { viteCommonjs, esbuildCommonjs } from "@originjs/vite-plugin-commonjs"
import Terminal from "vite-plugin-terminal"

// import r from "@rollup/plugin-commonjs"

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "build",
    sourcemap: true,
    // rollupOptions: {
    //   external: ["@subspace/vdf/dist/vdf.js"],
    // },
    commonjsOptions: {
      // Needed for `require` used in some packages
      transformMixedEsModules: true,
      dynamicRequireTargets: [
        // "@subspace/vdf",
        // "@subspace/vdf/dist/vdf.js",
        // "node_modules/@subspace/vdf/**/*.js",
        "node_modules/@subspace/vdf/dist/vdf.js",
      ],
      // ignoreDynamicRequires: true
    },
  },
  define: {
    // Shim for libraries that use nodejs `process`
    "process.env": {},
    // Node.js global to browser globalThis
    global: "globalThis",
  },
  // plugins: [react(), viteCommonjs()],
  plugins: [react(), wasm(), Terminal()],
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
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },

      // Enable esbuild polyfill plugins
      plugins: [
        NodeModulesPolyfillPlugin(),
        esbuildCommonjs(["@subspace/vdf"]),
      ],
    },
  },
})
