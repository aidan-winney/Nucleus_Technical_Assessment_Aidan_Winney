import { useEffect, useState } from "react";

type Operation = "add" | "subtract" | "multiply" | "divide";

type CalcResponse = {
  result: number;
};

export default function App() {
  const [display, setDisplay] = useState("0");
  const [firstValue, setFirstValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operation | null>(null);
  const [waitingForSecondValue, setWaitingForSecondValue] = useState(false);
  const [error, setError] = useState("");
  const [justEvaluated, setJustEvaluated] = useState(false);

  function inputDigit(digit: string) {
    setError("");
  
    if (justEvaluated) {
      setDisplay(digit);
      setFirstValue(null);
      setOperator(null);
      setWaitingForSecondValue(false);
      setJustEvaluated(false);
      return;
    }
  
    if (waitingForSecondValue) {
      setDisplay(digit);
      setWaitingForSecondValue(false);
      return;
    }
  
    setDisplay((prev) => (prev === "0" ? digit : prev + digit));
  }

  function inputDecimal() {
    setError("");
  
    if (justEvaluated) {
      setDisplay((prev) => (prev.includes(".") ? prev : prev + "."));
      setFirstValue(null);
      setOperator(null);
      setWaitingForSecondValue(false);
      setJustEvaluated(false);
      return;
    }
  
    if (waitingForSecondValue) {
      setDisplay("0.");
      setWaitingForSecondValue(false);
      return;
    }
  
    setDisplay((prev) => (prev.includes(".") ? prev : prev + "."));
  }

  function clearAll() {
    setDisplay("0");
    setFirstValue(null);
    setOperator(null);
    setWaitingForSecondValue(false);
    setJustEvaluated(false);
    setError("");
  }

  function backspace() {
    setError("");

    if (waitingForSecondValue) {
      return;
    }

    setDisplay((prev) => {
      if (prev.length <= 1 || prev === "-0") {
        return "0";
      }

      const next = prev.slice(0, -1);
      return next === "-" ? "0" : next;
    });
  }

  function toggleSign() {
    setError("");

    setDisplay((prev) => {
      if (prev === "0" || prev === "-0") {
        return "0";
      }

      if (prev === "0.") {
        return "-0.";
      }

      if (prev.startsWith("-")) {
        return prev.slice(1);
      }

      return `-${prev}`;
    });
  }

  function chooseOperator(nextOperator: Operation) {
    setError("");
    setJustEvaluated(false);
  
    const inputValue = Number(display);
  
    if (firstValue === null) {
      setFirstValue(inputValue);
      setOperator(nextOperator);
      setWaitingForSecondValue(true);
      return;
    }
  
    if (operator && !waitingForSecondValue) {
      void calculate(firstValue, inputValue, operator, nextOperator);
      return;
    }
  
    setOperator(nextOperator);
    setWaitingForSecondValue(true);
  }

  async function calculate(
    left?: number,
    right?: number,
    opOverride?: Operation,
    nextOperator?: Operation
  ) {
    setError("");

    const a = left ?? firstValue;
    const b = right ?? Number(display);
    const op = opOverride ?? operator;

    if (a === null || op === null) {
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          a,
          b,
          op,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail ?? "Calculation failed.");
        return;
      }

      const typed = data as CalcResponse;
      const resultString = String(typed.result);

      setDisplay(resultString);
      setFirstValue(typed.result);
      setOperator(nextOperator ?? null);
      setWaitingForSecondValue(true);
      setJustEvaluated(nextOperator === undefined);
    } catch {
      setError("Could not connect to the backend.");
    }
  }

  function handleEquals() {
    void calculate();
  }

  function renderDigitButton(digit: string) {
    return (
      <button onClick={() => inputDigit(digit)} className="calc-btn">
        {digit}
      </button>
    );
  }

  useEffect(() => {
  function handleKeyDown(event: KeyboardEvent) {
      const { key } = event;
  
      if (/^\d$/.test(key)) return void inputDigit(key);
      if (key === ".") return void inputDecimal();
      if (key === "+") return void chooseOperator("add");
      if (key === "-") return void chooseOperator("subtract");
      if (key === "*") return void chooseOperator("multiply");
      if (key === "/") return void chooseOperator("divide");
      if (key === "n" || key === "N") return toggleSign();
      if (key === "Enter" || key === "=") return void handleEquals();
      if (key === "Backspace") return void backspace();
      if (key === "Escape") return void clearAll();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [display, firstValue, operator, waitingForSecondValue]);

  return (
    <div className="page">
      <div className="calculator">
        <h1>Calculator</h1>

        <div className="display">{display}</div>

        <p className="keyboard-help">
          Keyboard: 0-9, +, -, *, /, Enter, Backspace, Esc, N for ±
        </p>

        {error && <div className="error">{error}</div>}

        <div className="button-grid">
          <button onClick={clearAll} className="calc-btn utility">
            AC
          </button>
          <button onClick={backspace} className="calc-btn utility">
            ⌫
          </button>
          <button onClick={toggleSign} className="calc-btn utility">
            ±
          </button>
          <button
            onClick={() => chooseOperator("divide")}
            className="calc-btn operator"
          >
            ÷
          </button>

          {renderDigitButton("7")}
          {renderDigitButton("8")}
          {renderDigitButton("9")}
          <button
            onClick={() => chooseOperator("multiply")}
            className="calc-btn operator"
          >
            ×
          </button>

          {renderDigitButton("4")}
          {renderDigitButton("5")}
          {renderDigitButton("6")}
          <button
            onClick={() => chooseOperator("subtract")}
            className="calc-btn operator"
          >
            −
          </button>

          {renderDigitButton("1")}
          {renderDigitButton("2")}
          {renderDigitButton("3")}
          <button
            onClick={() => chooseOperator("add")}
            className="calc-btn operator"
          >
            +
          </button>

          <button onClick={inputDecimal} className="calc-btn">
            .
          </button>
          {renderDigitButton("0")}
          <button onClick={handleEquals} className="calc-btn equals">
            =
          </button>
        </div>
      </div>
    </div>
  );
}