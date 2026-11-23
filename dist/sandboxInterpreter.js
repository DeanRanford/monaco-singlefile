import * as InterpreterModule from "./acorn_interpreter.js";

function resolveInterpreterConstructor() {
  return (
    InterpreterModule.Interpreter ??
    InterpreterModule.default?.Interpreter ??
    globalThis.Interpreter
  );
}

export class SandboxInterpreter {
  #InterpreterCtor;
  #defaultMaxSteps;
  #extraHooks;
  #activeInstance = null;

  constructor(options = {}) {
    this.#InterpreterCtor = resolveInterpreterConstructor();
    this.#defaultMaxSteps = options.maxSteps ?? 50000;
    this.#extraHooks = options.hooks ?? [];
  }

  get isAvailable() {
    return Boolean(this.#InterpreterCtor);
  }

  get currentInstance() {
    return this.#activeInstance;
  }

  run(code, maxSteps = this.#defaultMaxSteps) {
    const logs = [];

    if (!this.#InterpreterCtor) {
      return {
        ok: false,
        logs,
        error: "Interpreter constructor not found from acorn_interpreter.js."
      };
    }

    try {
      const InterpreterCtor = this.#InterpreterCtor;
      const instance = new InterpreterCtor(code, (interpreter, globalObject) => {
        this.#bindDefaultGlobals(interpreter, globalObject, logs);
        for (const hook of this.#extraHooks) {
          hook(interpreter, globalObject, logs);
        }
      });

      this.#activeInstance = instance;

      let steps = 0;
      while (instance.step()) {
        steps++;
        if (steps >= maxSteps) {
          return {
            ok: false,
            logs,
            error: `Execution stopped after ${maxSteps} steps (possible infinite loop).`
          };
        }
      }

      return {
        ok: true,
        result: instance.value,
        logs
      };
    } catch (err) {
      return {
        ok: false,
        logs,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }

  #bindDefaultGlobals(interpreter, globalObject, logs) {
    const printFn = interpreter.createNativeFunction((...args) => {
      const line = args.map((v) => String(v)).join(" ");
      logs.push(line);
      console.log("[Interpreter print]:", line);
      return undefined;
    });
    interpreter.setProperty(globalObject, "print", printFn);

    const gameObj = interpreter.nativeToPseudo({});
    interpreter.setProperty(globalObject, "game", gameObj);
    interpreter.setProperty(
      gameObj,
      "log",
      interpreter.createNativeFunction((msg) => {
        const line = String(msg);
        logs.push(`[game] ${line}`);
        console.log("[Interpreter game.log]:", line);
      })
    );
  }
}