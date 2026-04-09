# Engineering Intern Interview Questions

## Introduction

Thank you for your interest in the Nucleus Security Engineering
internship program! This document contains 2 primary interview
challenges for you. The first is a code review question, and the second
is a coding challenge.

For both, we absolutely encourage the use of AI. If you do use AI, we
would like for you to share your prompts and then answer the follow-up
questions about how you thought through your prompts.

We know this time of the year is crazy for college students and that
your time is very valuable. Please try not to spend more than about 1
total hour collectively on this.

------------------------------------------------------------------------

## Contents

-   Introduction
-   Code Review (10 minutes)
    -   Task
    -   PHP
    -   Python
    -   Code comments
    -   Follow-up Questions
-   Coding Challenge (\~50 minutes)
    -   Exercise
    -   Follow-up questions
-   Delivery

------------------------------------------------------------------------

# Code Review (10 minutes)

You are welcome and encouraged to use AI for this section. If you do,
please provide your prompts and answer the questions in the follow-up
section.

## Task

Your colleague or team member was given the following task:

1.  Add a `/webhook` endpoint to receive vendor events about users who
    are vendors.

2.  Input data will look like:

    ``` json
    {"email":"a@b.com","role":"admin","metadata":{"source":"vendor"}}
    ```

3.  Verify signature header `X-Signature`.

4.  Parse JSON and upsert the user data.

5.  Store the raw payload for audit/debug.

They have opened a PR with the code below. Review the code and comment
on any issues you find.

**Note:** Both the PHP and Python do the same thing. You can choose to
review whichever one you want. It is not intended for you to review
both.

------------------------------------------------------------------------

## PHP

``` php
<?php
// webhook.php
require_once "db.php"; // provides $pdo (PDO instance)

// Config (dev defaults)
$WEBHOOK_SECRET = getenv("WEBHOOK_SECRET") ?: "dev-secret";
$DB_AUDIT_ENABLED = getenv("AUDIT_ENABLED") ?: "true";

function verify_signature($sig, $body, $secret) {
    // Vendor docs: SHA256(secret + body)
    $expected = hash("sha256", $secret . $body);
    return $expected == $sig; // simple compare
}

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";
$path = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

// Basic routing
if ($method !== "POST" || $path !== "/webhook") {
    http_response_code(404);
    echo "not found";
    exit;
}

$raw = file_get_contents("php://input"); // raw body string
$sig = $_SERVER["HTTP_X_SIGNATURE"] ?? "";

if (!verify_signature($sig, $raw, $WEBHOOK_SECRET)) {
    http_response_code(401);
    echo "bad sig";
    exit;
}

// Decode JSON
$payload = json_decode($raw, true);
$email = $payload["email"] ?? "";
$role = $payload["role"] ?? "user";

// Store raw payload for auditing / debugging
if ($DB_AUDIT_ENABLED) {
    $pdo->exec("INSERT INTO webhook_audit(email, raw_json) VALUES ('$email', '$raw')");
}

// Upsert user (simple)
$pdo->exec("INSERT INTO users(email, role) VALUES('$email', '$role')");

echo "ok";
```

------------------------------------------------------------------------

## Python

``` python
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

------------------------------------------------------------------------

## Code comments

Put your code comments here. For comments on specific lines, please
include the line number. Feel free to comment on the general task as
well.

### Aidan's Answer:

There are a handful of issues with the Python pull request, especially on the security side, such as:

Line 10: The WEBHOOK_SECRET variable utilizes a default dev secret. This is fine for debugging and development, but should never be pushed into production. The default "dev-secret" fallback should be removed and the program should fail if no secret is provided.

Line 18: Decoding with UTF-8 can cause unexpected errors if the sig is not UTF-8 or if the JSON is invalid. Only encoding the secret with UTF-8 is necessary (``hashlib.sha256(WEBHOOK_SECRET.encode("utf-8") + body).hexdigest()``).

Line 20: A simple plain equality comparison is not secure here; a constant-time comparison should be used instead, such as ``hmac.compare_digest()``.

Line 25: The sig defaults to an empty string if the header is not found. Similar to the line 10 issue, this should not be pushed into production; the signature should be checked and the program should fail if a signature was not found.

Line 30: The payload is not checked for validity when loads() is called. If a decode error comes up, it should be caught and the program should abort.

Line 34-35: Like line 25, the email should not default to empty when it does not exist. Both the email and role should be checked for validity and the program should fail if either are not valid.

Line 37-50: The code flow here is poor, a with statement should be used so that the two transactions act together in the event that one fails (``with sqlite3.connect(DB_PATH) as db:``). This prevents an incomplete action where the two tables fall out of sync of each other. The db should also be closed at the end with ``db.close()`` for completeness, as the file could end up locked.

Line 42 and 47: These SQL queries should not being using f-strings, as they are vulnerable to injection attacks. The queries should be parameterized to be secure.

Line 47: This SQL query is currently not an upsert, as it has no mechanism to update the user if they already exist. To do so, SQLite3 has an ``ON CONFLICT ... DO UPDATE`` clause that can be used.

For the two queries, a correct and secure input would look like:
```python
"INSERT INTO webhook_audit(email, raw_json) VALUES (?, ?)", (email, raw_text)
```
for the payload storage, and:
```python
"""
INSERT INTO users(email, role)
VALUES (?, ?)
ON CONFLICT(email) DO UPDATE SET role = excluded.role
""",
(email, role),
```
for the user data upserting, where raw_text is the raw text decoded with UTF-8.

------------------------------------------------------------------------

## Follow-up Questions

1.  Share your prompts and the AI outputs.
2.  For each prompt:
    -   Tell us what you were hoping for the AI to accomplish.
    -   Tell us what it actually did.
    -   Did you have to re-prompt it based on its output?
    -   If you had to change your approach, why?

### Aidan's Answer:

1. https://chatgpt.com/share/69d6bf43-5034-832b-b9c2-e26038742eff. I've also added it in a separate markdown file in case problems occur accessing the link at ``Review_Prompts.md``.
2. The first prompt was intended to assist me with finding any issues that went past my initial scan. The plain equality, the default secret, and the desynced queries are what stuck out to me immediately, but the prompt pointed out some more obfuscated ones such as the f-string vulnerability. The output was what I was looking for, pointing out multiple issues with the code in paragraph form. I made a second prompt to ask for what the fixes would be in Python so I could compare the insecure PR code and the fixed secure code. The output was what I was expecting, with all of the changes looking sound to me after a closer inspection. I did not need to change my approach for this.

------------------------------------------------------------------------

# Coding Challenge (\~50 minutes)

For the below coding exercise, there is no expectation that you will
have a fully working solution. For anything you feel you didn't
accomplish, please let us know in the follow-up section after the
exercise.

## Exercise

Build a calculator web application. It should include a frontend piece
and any backend logic needed to perform the calculations.

You can use any language of your choosing for both the frontend and
backend code.

------------------------------------------------------------------------

## Follow-up questions

1.  How far were you able to get with the exercise?
2.  What challenges did you encounter in the process?
3.  If you were given unlimited time, what additional functionality
    would you include?
4.  If you used AI, please include all of your prompts and answer the
    following questions:
    -   What did the AI do well?
    -   What did the AI do poorly?
    -   For the places it did poorly, how did you change your approach
        to your prompts to improve its output?

### Aidan's Answer

1. I was able to create a four function calculator with support for adding, subtracting, multiplying, and dividing. It supports stringing together multiple operations (such as 1 + 2 = 3 + 4 = 7), flipping the sign of the current inputted value with the ± button, and adding a decimal place to your input when applicable. Lastly, keyboard support was added on top of the button support, with instructions on how to use it embedded into the calculator.
2. The primary issue I ran into with this task was the handling of the sign, decimal point, and carrying over the output of previous calculations into the last. One bug that presented itself was the decimal key initially wiping the previous output and replacing it with "0.". This was solved with the addition of a justEvaluated flag to track when the previous input was a calculation. Another bug I had involved the decimal place not carrying over to the next calculation properly. For example if doing 1 / 1, appending a .5 to it, then doing * 3 would result in an output of 3 since the .5 was being ignored in the frontend instead of the correct 4.5. This was fixed by a minor logic fix when inputting the decimal that I did not notice at first.
3. If I was given unlimited time, I would make this calculator act more like a scientific calculator, with the ability to string together multiple operations in one calculation. I would also add support for more operations, such as log, natural log, exponent, sin/cos/tan, sqrt, et cetera. Lastly, I would have implemented a history tab with the ability to queue up previous values or previous calculations.
4. https://chatgpt.com/share/69d75204-3cdc-832d-9831-9caec3f1843d. I've also added it in a separate markdown file in case problems occur accessing the link at ``Challenge_Prompts.md``.
- The AI was able to navigate the big picture of the problem well, with no real hiccups encountered with the set-up and initial run.
- However, it struggled with the finer details a bit more with some of bugs I mentioned in question 2 above, especially with the keyboard implementation, I had to ignore some of the proposed solutions for that.
- This required me to spend a decent amount of time debugging to figure out what features were bugged and what was wrong with them. This required changing my approach to ask more questions about existing features, rather than asking about new ones. Other than that, my approach worked well.

### Running the Code (Windows)

To run this code, most of it should be set up for you already. Make sure to have the most recent version of Node.js/npm and Python installed first. After that, in one terminal, cd into the ``calculator/frontend`` folder, then run ``npm install`` followed by ``npm run dev``. This will boot up the frontend on port 5173. Now, in a second terminal, cd into the ``calculator/backend`` folder, then run ``pip install -r requirements.txt`` followed by ``uvicorn main:app --reload`` to boot the backend server on port 8000. To view and use the calculator, go to ``http://localhost:5173/`` in your web browser. Let me know if you have any issues with with this on your end.

------------------------------------------------------------------------

# Delivery

Please reply to the email you received with:

1.  Answers to any follow-up above.
2.  Any questions or thoughts you had on the exercise.
3.  A link to a public GitHub repository including your answer to the
    coding challenge.
    -   If we can't get to the repository, we won't be able to consider
        your answer to the coding challenge.
