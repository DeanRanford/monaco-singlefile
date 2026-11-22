import * as monaco from "monaco-editor";

const WORKER_SOURCES = {
  editor: __MONACO_WORKER_EDITOR__,
  typescript: __MONACO_WORKER_TS__,
  javascript: __MONACO_WORKER_TS__,
  json: __MONACO_WORKER_JSON__,
  css: __MONACO_WORKER_CSS__,
  scss: __MONACO_WORKER_CSS__,
  less: __MONACO_WORKER_CSS__,
  html: __MONACO_WORKER_HTML__,
  handlebars: __MONACO_WORKER_HTML__,
  razor: __MONACO_WORKER_HTML__,
};

function createBlobWorker(sourceCode) {
  const blob = new Blob([sourceCode], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}

self.MonacoEnvironment = {
  getWorker(_moduleId, label) {
    const code = WORKER_SOURCES[label] || WORKER_SOURCES.editor;
    return createBlobWorker(code);
  },
};

export function createEditor(container, options = {}) {
  return monaco.editor.create(container, {
    value:
      "// Hello from a single-file Monaco bundle!\nconst x: number = 42;\n",
    language: "typescript",
    automaticLayout: true,
    ...options,
  });
}

export { monaco };
