

```
This Python webapp has a /webhook endpoint to log vendors. It first needs to verify the signature header X-Signature, then parse the JSON and upsert the input data, and lastly store the raw payload. What issues are present in the current implementation?:

# app.py
import os
import json
import sqlite3
import hashlib
from flask import Flask, request

app = Flask(__name__)
DB_PATH = os.getenv("DB_PATH", "/tmp/app.db")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "dev-secret")  # default for dev

def get_db():
    return sqlite3.connect(DB_PATH)

def verify(sig, body: bytes) -> bool:
    # Vendor docs: SHA256(secret + body)
    expected = hashlib.sha256(
        (WEBHOOK_SECRET + body.decode("utf-8")).encode("utf-8")
    ).hexdigest()
    return expected == sig  # simple compare

@app.post("/webhook")
def webhook():
    raw = request.data  # bytes
    sig = request.headers.get("X-Signature", "")

    if not verify(sig, raw):
        return ("bad sig", 401)

    payload = json.loads(raw.decode("utf-8"))

    # Example payload:
    # {"email":"a@b.com","role":"admin","metadata":{"source":"vendor"}}
    email = payload.get("email", "")
    role = payload.get("role", "user")

    db = get_db()
    cur = db.cursor()

    # Store raw payload for auditing / debugging
    cur.execute(
        f"INSERT INTO webhook_audit(email, raw_json) VALUES ('{email}', '{raw.decode('utf-8')}')"
    )

    # Upsert user
    cur.execute(
        f"INSERT INTO users(email, role) VALUES('{email}', '{role}')"
    )

    db.commit()

    return ("ok", 200)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
```

```
There are several problems here, both security and correctness-related.

The biggest issue is SQL injection. Both inserts are built with f-strings using untrusted data from the request, including email, role, and the raw JSON body. A payload containing quotes could break the SQL or inject arbitrary SQL. That affects both the audit table insert and the user insert.

The signature check also has two issues. First, it uses a plain equality comparison (expected == sig) instead of a constant-time comparison, which can leak information through timing. Second, the code assumes the vendor’s signing rule is literally SHA256(secret + body) and re-creates it by decoding and re-encoding the body as UTF-8. If the body is not valid UTF-8, or if the vendor expects the hash over the exact raw bytes, this can fail or behave incorrectly. It should verify against the original bytes, not a decoded/re-encoded version.

The app also has a dangerous default secret: WEBHOOK_SECRET falls back to "dev-secret". That is fine for local development only, but in practice it is easy to accidentally deploy with that default. A webhook endpoint should generally fail closed when the secret is unset.

The JSON parsing is not handled safely. json.loads(raw.decode("utf-8")) can raise if the body is invalid UTF-8 or invalid JSON, and that would likely produce a 500 instead of a clean 400 response. There is also no validation that the parsed object is actually the expected shape.

The “upsert user” code is not actually an upsert. It is just a plain INSERT INTO users(email, role). If email is unique, repeated webhook deliveries will fail with an integrity error. If it is not unique, you will create duplicates. A real upsert in SQLite would need ON CONFLICT(...) DO UPDATE.

There is also no transaction/error handling around the two writes. If one statement succeeds and the other fails, behavior depends on when the exception happens and whether the connection is properly closed. The code does call commit(), but it never closes the connection, and it does not roll back on failure. Over time that can lead to resource leaks or inconsistent handling.

Another correctness problem is that raw payload storage happens before the user write. If the user insert fails, you may still have an audit row without the corresponding user change. That may be acceptable for audit purposes, but if the intent is for both actions to succeed together, they should be in one controlled transaction.

Input validation is also weak. email = payload.get("email", "") means missing email becomes an empty string, and the code will still try to insert it. There is no check that email exists, is a string, or is non-empty. Same for role: any arbitrary value from the payload is accepted.

A few smaller issues:

request.data works, but request.get_data() is usually clearer in Flask.

The code assumes every request body is JSON but does not check Content-Type.

sqlite3.connect(DB_PATH) without row factory, timeout, or context management is bare-bones and not ideal for a web app.

Running Flask with app.run(host="0.0.0.0", port=8080) is the development server, not appropriate for production.

So, in summary, the main issues are:

SQL injection from f-string SQL

Non-constant-time signature comparison

Signature computed from decoded text instead of exact raw bytes

Unsafe default webhook secret

No JSON/error validation

“Upsert” is not actually an upsert

No proper transaction/rollback/connection cleanup

Weak validation of required fields like email

A safer version would use parameterized SQL, hmac.compare_digest, strict payload validation, a real SQLite upsert, and a managed transaction with proper exception handling.
```

```
What secure and correct alternative should be used for each of these issues?
```

```
Use these replacements.

SQL injection from f-string SQL
Use parameterized queries with placeholders.

cur.execute(
    "INSERT INTO webhook_audit(email, raw_json) VALUES (?, ?)",
    (email, raw_text),
)

cur.execute(
    """
    INSERT INTO users(email, role)
    VALUES(?, ?)
    ON CONFLICT(email) DO UPDATE SET role = excluded.role
    """,
    (email, role),
)
Non-constant-time signature comparison
Use hmac.compare_digest().

import hmac

return hmac.compare_digest(expected, sig)
Hashing decoded/re-encoded text instead of exact request bytes
Hash the raw bytes exactly as received. If the vendor really specifies SHA256(secret + body), do that with bytes, not with decode/re-encode.

def verify(sig: str, body: bytes) -> bool:
    expected = hashlib.sha256(WEBHOOK_SECRET.encode("utf-8") + body).hexdigest()
    return hmac.compare_digest(expected, sig)
If the vendor actually supports HMAC, that is even better:

def verify(sig: str, body: bytes) -> bool:
    expected = hmac.new(
        WEBHOOK_SECRET.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, sig)
Unsafe default secret
Do not fall back to a known development secret in production code. Require the environment variable and fail fast if missing.

WEBHOOK_SECRET = os.environ["WEBHOOK_SECRET"]
Or:

WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")
if not WEBHOOK_SECRET:
    raise RuntimeError("WEBHOOK_SECRET must be set")
Uncaught invalid JSON / UTF-8 parse failures
Use Flask’s JSON parsing or catch decoding/parsing exceptions and return 400, not 500.

from flask import request, abort

payload = request.get_json(silent=False)
if not isinstance(payload, dict):
    abort(400, "JSON object expected")
Or, if you need the raw body for signature verification first:

raw = request.get_data(cache=False)
try:
    payload = json.loads(raw)
except json.JSONDecodeError:
    return ("invalid json", 400)
No validation of required fields
Validate required fields explicitly before writing to the database.

email = payload.get("email")
role = payload.get("role", "user")

if not isinstance(email, str) or not email.strip():
    return ("invalid email", 400)

if not isinstance(role, str) or role not in {"user", "admin"}:
    return ("invalid role", 400)
“Upsert” is not actually an upsert
Use SQLite’s ON CONFLICT ... DO UPDATE on a unique key such as email.

cur.execute(
    """
    INSERT INTO users(email, role)
    VALUES (?, ?)
    ON CONFLICT(email) DO UPDATE SET role = excluded.role
    """,
    (email, role),
)
This assumes users.email has a UNIQUE constraint or is a primary key.

No transaction / rollback / cleanup
Use a context-managed connection so commit/rollback is handled correctly, and close resources automatically.

with sqlite3.connect(DB_PATH) as db:
    cur = db.cursor()
    ...
Within a with sqlite3.connect(...) as db: block, SQLite commits on success and rolls back on exception.

Connection leak from never closing DB connection
Again, use a context manager.

with sqlite3.connect(DB_PATH) as db:
    ...
Audit row and user row not clearly coordinated
Wrap both writes in one transaction if they should succeed or fail together.

with sqlite3.connect(DB_PATH) as db:
    cur = db.cursor()
    cur.execute("INSERT INTO webhook_audit(email, raw_json) VALUES (?, ?)", (email, raw_text))
    cur.execute(
        """
        INSERT INTO users(email, role)
        VALUES (?, ?)
        ON CONFLICT(email) DO UPDATE SET role = excluded.role
        """,
        (email, role),
    )
If you want the audit row preserved even when upsert fails, then use separate, intentional handling rather than accidental behavior.

Not checking request content type
Reject requests that are not JSON, or at least enforce JSON parsing expectations.

if not request.is_json:
    return ("content-type must be application/json", 415)
Using request.data directly
Prefer request.get_data() for clarity and consistency.

raw = request.get_data(cache=False)
Using the Flask dev server in production
Use a real WSGI server such as gunicorn, uWSGI, or waitress.

Example deployment command:

gunicorn -b 0.0.0.0:8080 app:app
Here is a compact corrected version:

import os
import json
import hmac
import sqlite3
import hashlib
from flask import Flask, request

app = Flask(__name__)
DB_PATH = os.environ["DB_PATH"]
WEBHOOK_SECRET = os.environ["WEBHOOK_SECRET"]

ALLOWED_ROLES = {"user", "admin"}

def verify(sig: str, body: bytes) -> bool:
    expected = hashlib.sha256(WEBHOOK_SECRET.encode("utf-8") + body).hexdigest()
    return hmac.compare_digest(expected, sig)

@app.post("/webhook")
def webhook():
    raw = request.get_data(cache=False)
    sig = request.headers.get("X-Signature")
    if not sig:
        return ("missing signature", 401)

    if not verify(sig, raw):
        return ("bad sig", 401)

    if not request.is_json:
        return ("content-type must be application/json", 415)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return ("invalid json", 400)

    if not isinstance(payload, dict):
        return ("json object expected", 400)

    email = payload.get("email")
    role = payload.get("role", "user")

    if not isinstance(email, str) or not email.strip():
        return ("invalid email", 400)

    if not isinstance(role, str) or role not in ALLOWED_ROLES:
        return ("invalid role", 400)

    raw_text = raw.decode("utf-8", errors="replace")

    with sqlite3.connect(DB_PATH) as db:
        cur = db.cursor()

        cur.execute(
            "INSERT INTO webhook_audit(email, raw_json) VALUES (?, ?)",
            (email, raw_text),
        )

        cur.execute(
            """
            INSERT INTO users(email, role)
            VALUES (?, ?)
            ON CONFLICT(email) DO UPDATE SET role = excluded.role
            """,
            (email, role),
        )

    return ("ok", 200)
If you want, I can also turn this into a version with schema definitions for users and webhook_audit.
```