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
        result = round(data.a + data.b, 10)
    elif data.op == "subtract":
        result = round(data.a - data.b, 10)
    elif data.op == "multiply":
        result = round(data.a * data.b, 10)
    elif data.op == "divide":
        if data.b == 0:
            raise HTTPException(status_code=400, detail="Cannot divide by zero")
        result = round(data.a / data.b, 10)
    else:
        raise HTTPException(status_code=400, detail="Invalid operation")

    return CalcResponse(result=result)