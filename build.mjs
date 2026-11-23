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

// 3. Bundle main app + Monaco + inlined worker code into dist/bundle.js
//    and automatically extract all imported CSS + data-URI fonts into dist/bundle.css
await esbuild.build({
  entryPoints: ["src/index.js"],
  bundle: true,
  minify: true,
  format: "iife",
  globalName: "MonacoApp",
  platform: "browser",
  outfile: "dist/bundle.js",
  loader: {
    ".ttf": "dataurl",
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".svg": "dataurl",
  },
  define: workerDefines,
});

console.log(
  "Built dist/bundle.js and dist/bundle.css with inlined Blob workers.",
);
