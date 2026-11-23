import * as Monaco from "./monaco.js";

const DEFAULT_CODE = [
  "// JS-Interpreter runs ES5-style JS in a sandbox",
  "function add(a, b) {",
  "  return a + b;",
  "}",
  'print("2 + 3 =", add(2, 3));',
  "add(10, 20);",
].join("\n");

export class MonacoController {
  #editor = null;
  #containerId;
  #stylesheetHref;
  #stylesheetId;
  #editorOptions;

  constructor(options = {}) {
    const bundle = Monaco.default ?? Monaco;
    this.monaco = bundle.monaco;

    this.#containerId = options.containerId ?? "monaco";
    this.#stylesheetHref = options.stylesheetHref ?? "./monaco.css";
    this.#stylesheetId = options.stylesheetId ?? "monaco-bundle-css";
    this.#editorOptions = {
      value: DEFAULT_CODE,
      language: "javascript",
      theme: "vs-dark",
      automaticLayout: true,
      ...options.editorOptions,
    };
  }

  get isReady() {
    return this.#editor !== null;
  }

  async mount() {
    if (this.#editor) return true;

    const container = document.getElementById(this.#containerId);
    if (!container) {
      console.warn(
        `Could not find DOM element with id "${this.#containerId}".`,
      );
      return false;
    }

    await this.#ensureStylesheet();

    const bundle = Monaco.default ?? Monaco;
    this.#editor = bundle.createEditor(container, this.#editorOptions);
    return true;
  }

  getValue() {
    return this.#editor ? this.#editor.getValue() : "";
  }

  setValue(value) {
    this.#editor?.setValue(value);
  }

  layout() {
    this.#editor?.layout();
  }

  dispose() {
    this.#editor?.dispose();
    this.#editor = null;
  }

  #ensureStylesheet() {
    return new Promise((resolve, reject) => {
      if (document.getElementById(this.#stylesheetId)) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.id = this.#stylesheetId;
      link.rel = "stylesheet";
      link.href = this.#stylesheetHref;
      link.onload = () => resolve();
      link.onerror = () =>
        reject(new Error(`Failed to load stylesheet: ${this.#stylesheetHref}`));
      document.head.appendChild(link);
    });
  }
}

/*


import { MonacoController } from "./monacoController.js";
import { SandboxInterpreter } from "./sandboxInterpreter.js";


const sandbox = new SandboxInterpreter({ maxSteps: 50000 });

function runEditorCode(maxSteps) {
  if (!monacoCtrl.isReady) {
    return { ok: false, logs: [], error: "Monaco editor is not initialized." };
  }
  return sandbox.run(monacoCtrl.getValue(), maxSteps);
}

window.runMonacoScript = runEditorCode;

runOnStartup(async (runtime) => {
  runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime) {
  await monacoCtrl.mount();

  const output = runEditorCode();
  console.log("Interpreter run output:", output);

  runtime.addEventListener("tick", () => Tick(runtime));
}

function Tick(runtime) {
  // Per-tick hook
}
*/
