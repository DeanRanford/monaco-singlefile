import * as Intepreter from "./acorn_interpreter.js";
import * as Monaco from "./monaco.js";

interface MonacoEditorInstance {
  getValue(): string;
  setValue(value: string): void;
  layout(): void;
  dispose(): void;
}

interface MonacoNamespace {
  editor: {
    create(el: HTMLElement, options?: Record<string, unknown>): MonacoEditorInstance;
    [key: string]: unknown;
  };
  languages: Record<string, unknown>;
  [key: string]: unknown;
}

interface MonacoBundleDefault {
  createEditor(el: HTMLElement, options?: Record<string, unknown>): MonacoEditorInstance;
  monaco: MonacoNamespace;
}

const { createEditor, monaco } = (Monaco as unknown as { default: MonacoBundleDefault }).default;

let monacoEditor: MonacoEditorInstance | null = null;

function ensureStylesheet(href: string, id = "monaco-bundle-css"): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    document.head.appendChild(link);
  });
}

function initEditor(): void {
  const container = document.getElementById("monaco");
  if (!container) {
    console.warn('Could not find DOM element with id "monaco".');
    return;
  }

  monacoEditor = createEditor(container, {
    value: [
      "function x() {",
      '    console.log("Hello world!");',
      "}; x();"
    ].join("\n"),
    language: "javascript",
    theme: "vs-dark",
    automaticLayout: true
  });
}

runOnStartup(async runtime => {
  runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime: IRuntime) {
  await ensureStylesheet("./monaco.css");
  initEditor();

  // Optional: access raw monaco namespace if needed, e.g.:
  // monaco.editor.setTheme("vs");
  void Intepreter;
  void monaco;

  runtime.addEventListener("tick", () => Tick(runtime));
}

function Tick(runtime: IRuntime) {
  // Code to run every tick
}