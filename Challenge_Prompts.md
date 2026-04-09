```
How could I start on making a full-stack calculator web application with a TypeScript front-end using React and a Python back-end?
```

```
Thought for 4s

Thought for 7s
A good way to start is to keep the app very small:

React + TypeScript frontend for the calculator UI

Python API backend for the calculation

frontend sends numbers and an operation to backend

backend returns the result as JSON

That gives you practice with routing, state, forms, HTTP, validation, and project structure without too much complexity.

A solid stack for this is:

Frontend: React + TypeScript with Vite

Backend: FastAPI in Python

React’s docs now recommend using a build tool like Vite when building a React app from scratch, and Vite’s current getting-started docs show create vite scaffolding and note the current Node.js requirements. FastAPI’s official docs provide a step-by-step tutorial and automatic API docs, which makes it especially nice for a small API project. 

1. Project structure
A simple layout:

calculator-app/
  frontend/
  backend/
2. Build the backend first
Start with a backend that accepts:

a

b

op (add, subtract, multiply, divide)

Example backend/main.py:

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CalcRequest(BaseModel):
    a: float
    b: float
    op: str

class CalcResponse(BaseModel):
    result: float

@app.get("/")
def root():
    return {"message": "Calculator API running"}

@app.post("/calculate", response_model=CalcResponse)
def calculate(data: CalcRequest):
    if data.op == "add":
        result = data.a + data.b
    elif data.op == "subtract":
        result = data.a - data.b
    elif data.op == "multiply":
        result = data.a * data.b
    elif data.op == "divide":
        if data.b == 0:
            raise HTTPException(status_code=400, detail="Cannot divide by zero")
        result = data.a / data.b
    else:
        raise HTTPException(status_code=400, detail="Invalid operation")

    return {"result": result}
Install and run:

pip install fastapi uvicorn
uvicorn main:app --reload
FastAPI’s “first steps” tutorial uses this same basic pattern: create a FastAPI() app, define path operations, and return JSON responses. 

3. Build the frontend
Create the frontend with Vite:

npm create vite@latest frontend
Choose:

React

TypeScript

Then install dependencies:

cd frontend
npm install
npm run dev
Vite’s official guide shows npm create vite@latest, and its docs currently note that Vite requires Node.js 20.19+ or 22.12+. 

4. Make a minimal React calculator
Example frontend/src/App.tsx:

import { useState } from "react";

type Operation = "add" | "subtract" | "multiply" | "divide";

type CalcResponse = {
  result: number;
};

export default function App() {
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [op, setOp] = useState<Operation>("add");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  const handleCalculate = async () => {
    setError("");
    setResult(null);

    const numA = Number(a);
    const numB = Number(b);

    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      setError("Please enter valid numbers.");
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          a: numA,
          b: numB,
          op,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Something went wrong.");
        return;
      }

      const typedData = data as CalcResponse;
      setResult(typedData.result);
    } catch {
      setError("Could not connect to backend.");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", fontFamily: "Arial" }}>
      <h1>Calculator</h1>

      <input
        type="number"
        value={a}
        onChange={(e) => setA(e.target.value)}
        placeholder="First number"
        style={{ display: "block", marginBottom: 12, width: "100%" }}
      />

      <input
        type="number"
        value={b}
        onChange={(e) => setB(e.target.value)}
        placeholder="Second number"
        style={{ display: "block", marginBottom: 12, width: "100%" }}
      />

      <select
        value={op}
        onChange={(e) => setOp(e.target.value as Operation)}
        style={{ display: "block", marginBottom: 12, width: "100%" }}
      >
        <option value="add">Add</option>
        <option value="subtract">Subtract</option>
        <option value="multiply">Multiply</option>
        <option value="divide">Divide</option>
      </select>

      <button onClick={handleCalculate}>Calculate</button>

      {result !== null && <p>Result: {result}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
5. Development flow
Run both servers in separate terminals:

# backend
uvicorn main:app --reload

# frontend
npm run dev
Then open the frontend in the browser and test it.

6. What this teaches you
This tiny project covers the main full-stack pieces:

React state with useState

TypeScript typing for API responses and UI state

HTTP requests with fetch

Backend validation with FastAPI + Pydantic

Error handling like divide-by-zero and invalid inputs

CORS so the frontend can call the backend during local development

FastAPI also generates interactive API documentation automatically from your declared routes and models, which is useful while building and testing. 

7. Good next upgrades
After the basic version works, add these one at a time:

calculation history

clear button

keyboard support

dark mode

unit tests

Docker setup

deployment

A clean next step is to move the API URL into a Vite environment variable instead of hardcoding it. Vite has built-in support for env files and modes. 

8. Best order to build it
I would do it in this order:

Create FastAPI backend with one /calculate endpoint.

Test it in FastAPI’s docs page.

Create React + TypeScript frontend.

Add a form with two inputs and an operation selector.

Connect the form to the backend with fetch.

Add validation and nicer UI.

That keeps the project simple and avoids getting stuck on too many moving parts at once.

I can lay out the exact starter files for both frontend/ and backend/ next.
```

```
Sure
```

```
Here’s a simple starter setup you can copy in directly.

Project layout
calculator-app/
  backend/
    main.py
    requirements.txt
  frontend/
    src/
      App.tsx
      main.tsx
      index.css
    index.html
    package.json
    tsconfig.json
    vite.config.ts
Backend
backend/requirements.txt
fastapi
uvicorn[standard]
pydantic
backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI()


# Allow the React dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CalcRequest(BaseModel):
    a: float
    b: float
    op: str


class CalcResponse(BaseModel):
    result: float


@app.get("/")
def read_root():
    return {"message": "Calculator API is running"}


@app.post("/calculate", response_model=CalcResponse)
def calculate(data: CalcRequest):
    if data.op == "add":
        result = data.a + data.b
    elif data.op == "subtract":
        result = data.a - data.b
    elif data.op == "multiply":
        result = data.a * data.b
    elif data.op == "divide":
        if data.b == 0:
            raise HTTPException(status_code=400, detail="Cannot divide by zero")
        result = data.a / data.b
    else:
        raise HTTPException(status_code=400, detail="Invalid operation")

    return CalcResponse(result=result)
Run the backend
From backend/:

python -m venv .venv
Activate it:

# Windows PowerShell
.venv\Scripts\Activate.ps1
Then install and run:

pip install -r requirements.txt
uvicorn main:app --reload
Your backend should now be at:

http://127.0.0.1:8000
Frontend
frontend/package.json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.0"
  }
}
frontend/tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" }
  ]
}
frontend/tsconfig.app.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
frontend/index.html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Calculator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
frontend/src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
frontend/src/App.tsx
import { useState } from "react";

type Operation = "add" | "subtract" | "multiply" | "divide";

type CalcResponse = {
  result: number;
};

export default function App() {
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [op, setOp] = useState<Operation>("add");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  async function handleCalculate() {
    setError("");
    setResult(null);

    const numA = Number(a);
    const numB = Number(b);

    if (a.trim() === "" || b.trim() === "") {
      setError("Please enter both numbers.");
      return;
    }

    if (Number.isNaN(numA) || Number.isNaN(numB)) {
      setError("Please enter valid numbers.");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          a: numA,
          b: numB,
          op
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail ?? "Request failed.");
        return;
      }

      const typed = data as CalcResponse;
      setResult(typed.result);
    } catch {
      setError("Could not connect to the backend.");
    }
  }

  function handleClear() {
    setA("");
    setB("");
    setOp("add");
    setResult(null);
    setError("");
  }

  return (
    <div className="page">
      <div className="card">
        <h1>Full-Stack Calculator</h1>

        <label>
          First number
          <input
            type="number"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder="Enter first number"
          />
        </label>

        <label>
          Second number
          <input
            type="number"
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder="Enter second number"
          />
        </label>

        <label>
          Operation
          <select
            value={op}
            onChange={(e) => setOp(e.target.value as Operation)}
          >
            <option value="add">Add</option>
            <option value="subtract">Subtract</option>
            <option value="multiply">Multiply</option>
            <option value="divide">Divide</option>
          </select>
        </label>

        <div className="buttons">
          <button onClick={handleCalculate}>Calculate</button>
          <button onClick={handleClear} className="secondary">
            Clear
          </button>
        </div>

        {result !== null && (
          <div className="result">
            <strong>Result:</strong> {result}
          </div>
        )}

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
frontend/src/index.css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #f4f4f4;
  color: #222;
}

.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 24px;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

h1 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.8rem;
}

label {
  display: block;
  margin-bottom: 16px;
  font-weight: 600;
}

input,
select {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 10px 12px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

button {
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 1rem;
  cursor: pointer;
}

button.secondary {
  background: #e5e5e5;
}

.result {
  margin-top: 20px;
  padding: 12px;
  background: #eef7ee;
  border-radius: 8px;
}

.error {
  margin-top: 20px;
  padding: 12px;
  background: #fdeaea;
  color: #a11;
  border-radius: 8px;
}
Run the frontend
From frontend/:

npm install
npm run dev
Open:

http://localhost:5173
How the pieces connect
The flow is:

User enters two numbers and picks an operation.

React sends a POST request to /calculate.

FastAPI performs the math.

FastAPI sends back JSON like:

{
  "result": 8
}
React displays the result.

A simpler way to create the frontend
Instead of creating all frontend files manually, you can scaffold it:

npm create vite@latest frontend
Then choose:

React
TypeScript
After that, replace the generated src/App.tsx and src/index.css with the versions above.

Good next improvements
Once this basic version works, the next upgrades I’d suggest are:

use calculator buttons instead of plain form inputs

add calculation history

use environment variables for the backend URL

add tests for the API

deploy frontend and backend separately

The next best step is adding a .env setup so the frontend does not hardcode http://127.0.0.1:8000.
```

```
How could the application be altered to use calculator buttons instead of plain form inputs?
```

```
Change the frontend from a “two inputs + operation dropdown” form into a small calculator that builds an expression from button presses.

Instead of storing a, b, and op separately, store:

the current display text

the first operand

the selected operator

whether the next digit should start a new number

A clean version looks like this.

Main idea
Replace this kind of state:

const [a, setA] = useState("");
const [b, setB] = useState("");
const [op, setOp] = useState<Operation>("add");
with this:

const [display, setDisplay] = useState("0");
const [firstValue, setFirstValue] = useState<number | null>(null);
const [operator, setOperator] = useState<Operation | null>(null);
const [waitingForSecondValue, setWaitingForSecondValue] = useState(false);
const [error, setError] = useState("");
Then the buttons update the display and state.

Example button-based App.tsx
import { useState } from "react";

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

  function inputDigit(digit: string) {
    setError("");

    if (waitingForSecondValue) {
      setDisplay(digit);
      setWaitingForSecondValue(false);
      return;
    }

    setDisplay((prev) => (prev === "0" ? digit : prev + digit));
  }

  function inputDecimal() {
    setError("");

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
    setError("");
  }

  function backspace() {
    if (waitingForSecondValue) return;

    setDisplay((prev) => {
      if (prev.length <= 1) return "0";
      return prev.slice(0, -1);
    });
  }

  function chooseOperator(nextOperator: Operation) {
    setError("");
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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          a,
          b,
          op
        })
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

  return (
    <div className="page">
      <div className="calculator">
        <h1>Calculator</h1>

        <div className="display">{display}</div>

        {error && <div className="error">{error}</div>}

        <div className="button-grid">
          <button onClick={clearAll} className="calc-btn utility">AC</button>
          <button onClick={backspace} className="calc-btn utility">⌫</button>
          <button onClick={() => chooseOperator("divide")} className="calc-btn operator">÷</button>
          <button onClick={() => chooseOperator("multiply")} className="calc-btn operator">×</button>

          {renderDigitButton("7")}
          {renderDigitButton("8")}
          {renderDigitButton("9")}
          <button onClick={() => chooseOperator("subtract")} className="calc-btn operator">−</button>

          {renderDigitButton("4")}
          {renderDigitButton("5")}
          {renderDigitButton("6")}
          <button onClick={() => chooseOperator("add")} className="calc-btn operator">+</button>

          {renderDigitButton("1")}
          {renderDigitButton("2")}
          {renderDigitButton("3")}
          <button onClick={handleEquals} className="calc-btn equals">=</button>

          <button onClick={inputDecimal} className="calc-btn">.</button>
          {renderDigitButton("0")}
        </div>
      </div>
    </div>
  );
}
Matching CSS
You could replace your index.css with this:

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #f3f4f6;
  color: #111827;
}

.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.calculator {
  width: 100%;
  max-width: 360px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.calculator h1 {
  margin: 0 0 16px;
  font-size: 1.5rem;
  text-align: center;
}

.display {
  width: 100%;
  min-height: 72px;
  background: #111827;
  color: white;
  border-radius: 12px;
  padding: 16px;
  font-size: 2rem;
  text-align: right;
  overflow-x: auto;
  margin-bottom: 12px;
}

.error {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 0.95rem;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.calc-btn {
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 1.1rem;
  cursor: pointer;
  background: #e5e7eb;
}

.calc-btn:hover {
  opacity: 0.95;
}

.calc-btn.operator {
  background: #dbeafe;
  font-weight: bold;
}

.calc-btn.equals {
  background: #c7f9cc;
  grid-row: span 2;
}

.calc-btn.utility {
  background: #f3f4f6;
}
What changed conceptually
Before, the UI was a form:

type first number

type second number

choose operation

click calculate

Now, the UI behaves like a calculator:

click digit buttons to build a number

click +, -, ×, or ÷

click more digits

click =

The backend can stay almost exactly the same, because the frontend still eventually sends:

{
  "a": 12,
  "b": 7,
  "op": "add"
}
So this is mostly a frontend state-management change, not a backend rewrite.

Nice next upgrades
After this, the most useful additions would be:

keyboard support

negative number button (+/-)

percent button

calculation history panel

disabling buttons while the API request is in flight

I can also turn this into a more realistic calculator layout with all buttons aligned like a phone calculator.
```

```
How could a negative button be added to the calculator?
```

```
Adding a negative (+/−) button is a great next step—and it’s mostly a small state update.

There are two common behaviors for a calculator’s negative button:

Toggle sign of the current number (standard behavior ✅)

Treat it as subtraction (you already have this)

We want #1: toggle the sign of the current display value.

1. Add the handler function
Add this function to your App.tsx:

function toggleSign() {
  setError("");

  setDisplay((prev) => {
    if (prev === "0") return prev;

    if (prev.startsWith("-")) {
      return prev.slice(1); // remove "-"
    } else {
      return "-" + prev; // add "-"
    }
  });
}
What it does:
"5" → "-5"

"-5" → "5"

"0" stays "0" (avoids weird -0 cases)

2. Add the button to the UI
Update your button grid.

For example, modify the bottom row:

<div className="button-grid">
  <button onClick={clearAll} className="calc-btn utility">AC</button>
  <button onClick={backspace} className="calc-btn utility">⌫</button>
  <button onClick={toggleSign} className="calc-btn utility">±</button>
  <button onClick={() => chooseOperator("divide")} className="calc-btn operator">÷</button>

  {renderDigitButton("7")}
  {renderDigitButton("8")}
  {renderDigitButton("9")}
  <button onClick={() => chooseOperator("multiply")} className="calc-btn operator">×</button>

  {renderDigitButton("4")}
  {renderDigitButton("5")}
  {renderDigitButton("6")}
  <button onClick={() => chooseOperator("subtract")} className="calc-btn operator">−</button>

  {renderDigitButton("1")}
  {renderDigitButton("2")}
  {renderDigitButton("3")}
  <button onClick={() => chooseOperator("add")} className="calc-btn operator">+</button>

  <button onClick={inputDecimal} className="calc-btn">.</button>
  {renderDigitButton("0")}
  <button onClick={handleEquals} className="calc-btn equals">=</button>
</div>
3. Optional: handle edge cases better
If you want slightly more polished behavior:

Prevent -0
if (prev === "0" || prev === "-0") return "0";
Handle decimal edge case (-0.)
if (prev === "0.") return "-0.";
4. Important: No backend changes needed
Your backend already accepts negative numbers:

{
  "a": -5,
  "b": 3,
  "op": "add"
}
So nothing needs to change there 👍

5. What this improves
You now support:

5 → ± → -5

-5 × 3

± before or after selecting an operator

This makes your calculator behave like a real one.

6. Next nice upgrade (highly recommended)
If you want to make this feel really polished:

Add keyboard support:

- → toggle sign when appropriate

Add % (percentage)

Add chaining (e.g., 2 + 3 + 4 =)

If you want, I can next show you how to implement keyboard input (like typing numbers and operators)—that’s the biggest UX improvement after this.
```

```
How could I add keyboard support?
```

```
Add a keydown listener in React and map keys like 0-9, ., +, -, *, /, Enter, =, Backspace, and Escape to your existing calculator handlers.

That way, you do not rewrite the calculator logic. You just reuse:

inputDigit

inputDecimal

chooseOperator

handleEquals

backspace

clearAll

toggleSign

1. Import useEffect
At the top of App.tsx, change:

import { useState } from "react";
to:

import { useEffect, useState } from "react";
2. Add keyboard support inside the component
Put this inside App():

useEffect(() => {
  function handleKeyDown(event: KeyboardEvent) {
    const { key } = event;

    if (/^\d$/.test(key)) {
      event.preventDefault();
      inputDigit(key);
      return;
    }

    if (key === ".") {
      event.preventDefault();
      inputDecimal();
      return;
    }

    if (key === "+") {
      event.preventDefault();
      chooseOperator("add");
      return;
    }

    if (key === "-") {
      event.preventDefault();
      chooseOperator("subtract");
      return;
    }

    if (key === "*") {
      event.preventDefault();
      chooseOperator("multiply");
      return;
    }

    if (key === "/") {
      event.preventDefault();
      chooseOperator("divide");
      return;
    }

    if (key === "Enter" || key === "=") {
      event.preventDefault();
      handleEquals();
      return;
    }

    if (key === "Backspace") {
      event.preventDefault();
      backspace();
      return;
    }

    if (key === "Escape") {
      event.preventDefault();
      clearAll();
      return;
    }
  }

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [display, firstValue, operator, waitingForSecondValue]);
That is enough to make the keyboard control the calculator.

3. Full example with a negative-key shortcut
If you also want a keyboard shortcut for the ± behavior, a practical choice is:

n to toggle sign

Example:

useEffect(() => {
  function handleKeyDown(event: KeyboardEvent) {
    const { key } = event;

    if (/^\d$/.test(key)) {
      event.preventDefault();
      inputDigit(key);
      return;
    }

    switch (key) {
      case ".":
        event.preventDefault();
        inputDecimal();
        break;
      case "+":
        event.preventDefault();
        chooseOperator("add");
        break;
      case "-":
        event.preventDefault();
        chooseOperator("subtract");
        break;
      case "*":
        event.preventDefault();
        chooseOperator("multiply");
        break;
      case "/":
        event.preventDefault();
        chooseOperator("divide");
        break;
      case "Enter":
      case "=":
        event.preventDefault();
        handleEquals();
        break;
      case "Backspace":
        event.preventDefault();
        backspace();
        break;
      case "Escape":
        event.preventDefault();
        clearAll();
        break;
      case "n":
      case "N":
        event.preventDefault();
        toggleSign();
        break;
      default:
        break;
    }
  }

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [display, firstValue, operator, waitingForSecondValue]);
4. Better version: avoid re-registering on every state change
The previous version works, but because the effect depends on calculator state, it removes and re-adds the listener often.

A cleaner approach is to wrap your handlers in useCallback, then depend on those callbacks instead. For a small app this is optional, but it is a nice improvement.

For now, the simple version is completely fine.

5. Small UX improvement: show keyboard help
You can add a short hint under the calculator display:

<p className="keyboard-help">
  Keyboard: 0-9, +, -, *, /, Enter, Backspace, Esc, N for ±
</p>
And CSS:

.keyboard-help {
  margin: 10px 0 14px;
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
}
6. One thing to watch out for
If you later add real <input> fields back into the page, global keyboard shortcuts can interfere with typing into them. In that case, you would want to ignore key events when focus is inside an input:

const target = event.target as HTMLElement | null;
if (
  target &&
  (target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable)
) {
  return;
}
For your current button-only calculator, that is usually not necessary.

7. Minimal patch to your current calculator
The smallest change is just this:

import { useEffect, useState } from "react";
and:

useEffect(() => {
  function handleKeyDown(event: KeyboardEvent) {
    const { key } = event;

    if (/^\d$/.test(key)) return void inputDigit(key);
    if (key === ".") return void inputDecimal();
    if (key === "+") return void chooseOperator("add");
    if (key === "-") return void chooseOperator("subtract");
    if (key === "*") return void chooseOperator("multiply");
    if (key === "/") return void chooseOperator("divide");
    if (key === "Enter" || key === "=") return void handleEquals();
    if (key === "Backspace") return void backspace();
    if (key === "Escape") return void clearAll();
  }

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [display, firstValue, operator, waitingForSecondValue]);
That gets you working keyboard support right away.

I can also show you a cleaned-up full App.tsx with both button clicks and keyboard controls combined.
```

```
Sure
```

```
Here is a cleaned-up App.tsx that includes:

button-based calculator UI

± negative toggle

keyboard support

backend API call to Python /calculate

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

  function inputDigit(digit: string) {
    setError("");

    if (waitingForSecondValue) {
      setDisplay(digit);
      setWaitingForSecondValue(false);
      return;
    }

    setDisplay((prev) => (prev === "0" ? digit : prev + digit));
  }

  function inputDecimal() {
    setError("");

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

      if (/^\d$/.test(key)) {
        event.preventDefault();
        inputDigit(key);
        return;
      }

      switch (key) {
        case ".":
          event.preventDefault();
          inputDecimal();
          break;
        case "+":
          event.preventDefault();
          chooseOperator("add");
          break;
        case "-":
          event.preventDefault();
          chooseOperator("subtract");
          break;
        case "*":
          event.preventDefault();
          chooseOperator("multiply");
          break;
        case "/":
          event.preventDefault();
          chooseOperator("divide");
          break;
        case "Enter":
        case "=":
          event.preventDefault();
          handleEquals();
          break;
        case "Backspace":
          event.preventDefault();
          backspace();
          break;
        case "Escape":
          event.preventDefault();
          clearAll();
          break;
        case "n":
        case "N":
          event.preventDefault();
          toggleSign();
          break;
        default:
          break;
      }
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
And here is matching index.css:

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #f3f4f6;
  color: #111827;
}

.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.calculator {
  width: 100%;
  max-width: 360px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding: 20px;
}

.calculator h1 {
  margin: 0 0 16px;
  font-size: 1.5rem;
  text-align: center;
}

.display {
  width: 100%;
  min-height: 72px;
  background: #111827;
  color: white;
  border-radius: 12px;
  padding: 16px;
  font-size: 2rem;
  text-align: right;
  overflow-x: auto;
  margin-bottom: 10px;
}

.keyboard-help {
  margin: 0 0 12px;
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
}

.error {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 0.95rem;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.calc-btn {
  border: none;
  border-radius: 12px;
  padding: 16px;
  font-size: 1.1rem;
  cursor: pointer;
  background: #e5e7eb;
}

.calc-btn:hover {
  opacity: 0.95;
}

.calc-btn.operator {
  background: #dbeafe;
  font-weight: bold;
}

.calc-btn.equals {
  background: #c7f9cc;
  grid-column: span 2;
}

.calc-btn.utility {
  background: #f3f4f6;
}
One small note: with this exact grid, the = button spans two columns on the last row, which fits the current 4-column layout better than making it span two rows.

If you want, I can also show the next cleanup step: refactoring the keyboard handler so the event listener is not reattached on every state change.
```

```
Pressing the "." key after a calculation wipes the previous value and sets it to "0.". How could this bug be handled?
```

```
That happens because inputDecimal() is using the same waitingForSecondValue branch for two different situations:

you just pressed an operator and are starting the second operand

you just pressed = and are looking at a finished result

Those should behave differently.

Right now you have:

function inputDecimal() {
  setError("");

  if (waitingForSecondValue) {
    setDisplay("0.");
    setWaitingForSecondValue(false);
    return;
  }

  setDisplay((prev) => (prev.includes(".") ? prev : prev + "."));
}
After calculate(), you do this:

setDisplay(resultString);
setFirstValue(typed.result);
setOperator(nextOperator ?? null);
setWaitingForSecondValue(true);
So pressing . after = goes into that first branch and replaces the result with "0.".

Better fix: track “just evaluated” separately
Add a new piece of state:

const [justEvaluated, setJustEvaluated] = useState(false);
Update calculate()
When = finishes a calculation, mark that state:

setDisplay(resultString);
setFirstValue(typed.result);
setOperator(nextOperator ?? null);
setWaitingForSecondValue(true);
setJustEvaluated(nextOperator === undefined);
That means:

if this was a normal = press, justEvaluated becomes true

if this was operator chaining like 2 + 3 +, it stays false

Update chooseOperator()
When the user presses an operator, they are no longer in the “just evaluated” mode:

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
Update inputDigit()
If the user presses a digit after =, start a new number:

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
Update inputDecimal()
This is the key fix. After =, append a decimal to the result instead of replacing it:

function inputDecimal() {
  setError("");

  if (justEvaluated) {
    setDisplay((prev) => (prev.includes(".") ? prev : prev + "."));
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
Also reset it in clearAll()
function clearAll() {
  setDisplay("0");
  setFirstValue(null);
  setOperator(null);
  setWaitingForSecondValue(false);
  setJustEvaluated(false);
  setError("");
}
Result
Now behavior becomes:

2 + 3 = → display shows 5

press . → display becomes 5.

press 7 → display becomes 5.7

while this still works:

2 + then . → display becomes 0.

That preserves normal calculator behavior in both cases.

A slightly cleaner long-term version is to replace waitingForSecondValue with a more explicit mode like "entering-first" | "entering-second" | "showing-result", but justEvaluated is the smallest fix.
```

```
This set of operations are failing: "1 / 1 = . 5 * 3 =". This should output 4.5 since 1/1 = 1 and 1.5*3=4.5, but the 2nd = call does nothing to the display; the 3 stays there. Why is that?
```

```
Thought for 13s
Because after 1 / 1 =, your calculator is still carrying the old result state internally:

display = "1"

firstValue = 1

operator = null

justEvaluated = true

Then:

. makes the display 1.

5 makes it 1.5

But unless you also reset the stored calculation state, firstValue is still the old 1.

So when you press *, your chooseOperator() likely uses the stale firstValue instead of the current display value 1.5. Then = computes:

1 * 3 = 3
Since the display is already showing 3 when you press =, it looks like = did nothing.

Why this happens
Your fix for the decimal bug probably changed only the display logic, not the internal operand state.

After editing a finished result, the calculator should no longer treat the old result as the active first operand. Once the user turns 1 into 1.5, that new number should become the basis for the next operation.

The fix
When the user starts editing immediately after =, clear the stored operation state.

Update inputDigit()
You may already have this part:

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
That is good.

Update inputDecimal()
This is the important part. In the justEvaluated branch, also clear firstValue and operator:

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
Why this fixes it
Now the sequence becomes:

1 / 1 = → result is 1

. → display becomes 1., and old firstValue is cleared

5 → display becomes 1.5

* → chooseOperator() sees firstValue === null, so it stores 1.5 as the new first operand

3

= → calculates 1.5 * 3 = 4.5

Even safer improvement
You can also make chooseOperator() always use the current display when starting a new operation:

function chooseOperator(nextOperator: Operation) {
  setError("");
  setJustEvaluated(false);

  const inputValue = Number(display);

  if (firstValue === null || operator === null) {
    setFirstValue(inputValue);
    setOperator(nextOperator);
    setWaitingForSecondValue(true);
    return;
  }

  if (!waitingForSecondValue) {
    void calculate(firstValue, inputValue, operator, nextOperator);
    return;
  }

  setOperator(nextOperator);
}
That makes it more robust against stale state.

Bottom line
The bug is that after editing a completed result with ., the calculator updates the display but still keeps the old stored operand. Clearing firstValue and operator in inputDecimal() fixes it.

If you want, I can rewrite the full App.tsx with this fix merged in cleanly.
```