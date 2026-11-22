import * as esbuild from "esbuild";

// 1. Define the workers you need (add/remove based on languages you support)
const workerEntries = {
  editor: "monaco-editor/editor/editor.worker.js",
  ts: "monaco-editor/language/typescript/ts.worker.js",
  json: "monaco-editor/language/json/json.worker.js",
  css: "monaco-editor/language/css/css.worker.js",
  html: "monaco-editor/language/html/html.worker.js",
};

const workerDefines = {};

// 2. Compile each worker in memory into a self-contained JS string
for (const [key, entryPoint] of Object.entries(workerEntries)) {
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    write: false,
    minify: true,
    format: "iife",
    platform: "browser",
  });

  const code = result.outputFiles[0].text;
  workerDefines[`__MONACO_WORKER_${key.toUpperCase()}__`] =
    JSON.stringify(code);
}

// 3. Small plugin so Monaco's .css imports get injected into <head> inside the 1 JS file
const injectCssPlugin = {
  name: "inject-css",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const { text } = await esbuild.build({
        entryPoints: [args.path],
        bundle: true,
        write: false,
        minify: true,
        loader: {
          ".ttf": "dataurl",
          ".woff": "dataurl",
          ".woff2": "dataurl",
          ".svg": "dataurl",
        },
      });
      const cssString = JSON.stringify(text);
      return {
        contents: `
          if (typeof document !== 'undefined') {
            const style = document.createElement('style');
            style.textContent = ${cssString};
            document.head.appendChild(style);
          }
        `,
        loader: "js",
      };
    });
  },
};

// 4. Bundle main app + Monaco + inlined worker code into a single JS file
await esbuild.build({
  entryPoints: ["src/index.js"],
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "MonacoApp",
  platform: "browser",
  outfile: "dist/bundle.js",
  plugins: [injectCssPlugin],
  define: workerDefines,
});

console.log("Built dist/bundle.js with inlined Blob workers.");
