import { MonacoController } from "./monacoController.js";
import { SandboxInterpreter } from "./sandboxInterpreter.js";

const DEFAULT_MAX_STEPS = 50000;

const monacoCtrl = new MonacoController();
const sandbox = new SandboxInterpreter({ maxSteps: DEFAULT_MAX_STEPS });

const consoleEl = document.getElementById("console-output");
const runBtn = document.getElementById("run-btn");
const clearBtn = document.getElementById("clear-btn");

let lastTime = performance.now();
let tickCount = 0;

function appendOutput(text, isError = false) {
  if (!consoleEl) return;
  const line = document.createElement("div");
  if (isError) line.className = "error-text";
  line.textContent = text;
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

function renderResult(result) {
  if (!result) return;

  if (Array.isArray(result.logs) && result.logs.length > 0) {
    for (const entry of result.logs) {
      const formatted =
        typeof entry === "object"
          ? JSON.stringify(entry, null, 2)
          : String(entry);
      appendOutput(formatted, false);
    }
  }

  if (!result.ok && result.error) {
    appendOutput(`Error: ${result.error}`, true);
  } else if (result.value !== undefined) {
    const formattedValue =
      typeof result.value === "object"
        ? JSON.stringify(result.value, null, 2)
        : String(result.value);
    appendOutput(`=> ${formattedValue}`, false);
  }
}

function runEditorCode(maxSteps = DEFAULT_MAX_STEPS) {
  if (!monacoCtrl.isReady) {
    const errResult = {
      ok: false,
      logs: [],
      error: "Monaco editor is not initialized.",
    };
    renderResult(errResult);
    return errResult;
  }

  const code = monacoCtrl.getValue();
  const result = sandbox.run(code, maxSteps);
  renderResult(result);
  return result;
}

window.runMonacoScript = runEditorCode;

async function onBeforeStart() {
  // If your MonacoController accepts a container element/selector, pass it here, e.g.:
  // await monacoCtrl.mount(document.getElementById("monaco-editor"));
  await monacoCtrl.mount();

  const output = runEditorCode();
  console.log("Interpreter run output:", output);

  lastTime = performance.now();
  requestAnimationFrame(tick);
}

function tick(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  tickCount += 1;

  // Per-tick hook replacement for Construct 3's runtime "tick" event
  onTick({ dt, now, tickCount });

  requestAnimationFrame(tick);
}

function onTick(frameState) {
  // Add per-frame logic here if needed (frameState.dt is delta time in seconds)
  void frameState;
}

runBtn?.addEventListener("click", () => {
  runEditorCode();
});

clearBtn?.addEventListener("click", () => {
  if (consoleEl) consoleEl.textContent = "";
});

window.addEventListener("DOMContentLoaded", () => {
  onBeforeStart().catch((err) => {
    console.error("Failed to initialize editor:", err);
    appendOutput(`Initialization error: ${err?.message ?? err}`, true);
  });
});
