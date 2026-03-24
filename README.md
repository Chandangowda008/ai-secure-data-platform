# AI Secure Data Intelligence Platform

Production-ready hackathon full-stack project focused on secure log intelligence.

This platform acts as:
- AI Gateway
- Data Scanner
- Log Analyzer (core)
- Risk Engine

## What it does
- Processes text, logs, SQL snippets, chat messages, and file uploads
- Supports file uploads: `.log`, `.txt`, `.pdf`, `.docx`, `.doc`
- Parses logs line-by-line
- Detects:
  - Emails
  - Phone numbers
  - API keys (`sk-...` and common key formats)
  - Passwords
  - Tokens
  - Private key material
  - Credential pairs (`username + password` patterns)
  - IP addresses
  - Stack traces / exceptions
  - Failed login patterns
  - Suspicious injection/path traversal patterns
- Returns findings with:
  - `type`
  - `risk` (`low`, `medium`, `high`, `critical`)
  - `line`
  - `message`
  - `match`

## Risk engine
Scoring rules:
- critical -> +5
- high -> +3
- medium -> +2
- low -> +1

Output fields:
- `risk_score`
- `risk_level` (`low`, `medium`, `high`)

## AI-powered insights
The system generates concrete, high-signal insights using Groq-enhanced interpretation with rule-based fallback, including examples like:
- API key exposed in logs
- Multiple failed login attempts detected
- Sensitive user data logged in plain text

The AI layer enhances interpretation only. Detection and risk scoring remain deterministic and rule-based.

## Backend architecture

```text
backend/
├── routes/
│   └── analyzeRoutes.js
├── controllers/
│   └── analyzeController.js
├── services/
│   ├── logAnalyzer.js
│   ├── regexScanner.js
│   ├── riskEngine.js
│   ├── aiInsights.js
├── utils/
│   ├── asyncHandler.js
│   ├── chunkProcessor.js
│   └── summaryBuilder.js
├── middleware/
│   ├── errorHandler.js
│   ├── upload.js
│   └── validateAnalyzeRequest.js
├── .gitignore
├── index.js
└── package.json
```

## Frontend
React + Vite UI provides:
- Text/Log mode, File Upload mode, and Live Chat mode
- File upload support for `.log`, `.txt`, `.pdf`, `.docx`, `.doc`
- Analyze button
- Policy toggles:
  - Mask Sensitive Data
  - Block High Risk
- Results panel with:
  - Highlighted risk level
  - Findings with line numbers
  - Insights panel
  - Recommended actions
  - Correlation insights
- Bonus: risky-line highlighting with severity colors
  - Red: critical
  - Orange: high
  - Yellow: medium

## API
### POST `/api/analyze`

Request (text/log/sql/chat):

```json
{
  "input_type": "text",
  "content": "2026-03-24 ERROR api_key=sk-1234567890abcdefghijklmnop",
  "options": {
    "mask": false,
    "block_high_risk": false
  }
}
```

Supported `input_type`: `text`, `log`, `file`, `sql`, `chat`

Request (file):
- `multipart/form-data`
- field `input_type=file`
- field `file=<.log | .txt | .pdf | .docx | .doc>`
- optional field `options={"mask":true,"block_high_risk":false}`

Response (allowed/masked):

```json
{
  "content_type": "text",
  "action": "allowed",
  "summary": "Critical issue: 1 API key exposure event(s) detected with overall high risk.",
  "findings": [
    {
      "type": "api_key",
      "risk": "critical",
      "line": 1,
      "message": "API key exposed in logs",
      "match": "api_key=sk-123..."
    }
  ],
  "risk_score": 5,
  "risk_level": "medium",
  "correlations": [],
  "insights": [
    "API key exposed in logs (1 occurrence)."
  ],
  "recommended_actions": [
    "Rotate exposed API keys immediately"
  ],
  "explanation": "The content includes exposed credentials and authentication artifacts.",
  "metadata": {
    "total_lines": 1,
    "analyzed_lines": 1,
    "truncated": false,
    "failedLogins": 0,
    "finding_type_counts": {
      "api_key": 1
    }
  }
}
```

Response (blocked by policy):

```json
{
  "content_type": "text",
  "action": "blocked",
  "reason": "Input blocked by policy: risk level is high or critical findings detected.",
  "risk_score": 14,
  "risk_level": "high",
  "findings_count": 4
}
```

## Local setup

### 1) Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
# required for AI enrichment (Groq)
GROQ_API_KEY=your_groq_api_key_here

# optional
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# request limits
MAX_UPLOAD_BYTES=10485760
MAX_CONTENT_CHARS=1000000
JSON_LIMIT=10mb
RATE_LIMIT_MAX=100
MAX_ANALYZE_LINES=50000
ANALYZE_CHUNK_SIZE=500

# AI model (optional)
AI_MODEL=llama-3.1-8b-instant
```

Run backend:

```bash
npm run dev
```

Backend URL: `http://localhost:5000`

### 2) Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173`

If needed, create `frontend/.env` and set:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Security and scalability controls
- Input validation for `input_type` and content/file mode
- Upload guardrails for extension, MIME type, and file size
- JSON size limits
- Chunked async line processing to reduce event loop blocking
- Stable error handling for malformed input and unsupported uploads
- Optional policy actions: block high-risk requests or mask sensitive output

## Example test inputs
- `examples/sample.log`
- `examples/sample.txt`

## Optional AI configuration
In `backend/.env` you can also set:

```env
AI_MODEL=llama-3.1-8b-instant
```

If `GROQ_API_KEY` is missing or the AI call fails, the app automatically falls back to rule-based insights and actions.

## Quick verification
1. Start backend and frontend.
2. Analyze `examples/sample.log` (paste or upload).
3. Confirm findings include `type`, `risk`, and `line`.
4. Enable `Mask Sensitive Data` and verify masked output is returned.
5. Enable `Block High Risk` and verify high-risk input returns `403` with `action=blocked`.
6. Confirm risk score follows severity scoring map.
7. Confirm insights and recommended actions are concrete and non-generic.

## Deploy on Vercel (single project: frontend + backend)
This repository is configured to deploy both frontend and backend in one Vercel project using `vercel.json`.

### Steps
1. Import this GitHub repository in Vercel.
2. Keep project root at repository root.
3. Deploy (Vercel will build frontend and backend based on `vercel.json`).

### Environment variables in Vercel
Set these in Project Settings -> Environment Variables:

```env
NODE_ENV=production
MAX_UPLOAD_BYTES=10485760
MAX_CONTENT_CHARS=1000000
JSON_LIMIT=10mb
RATE_LIMIT_MAX=100
MAX_ANALYZE_LINES=50000
ANALYZE_CHUNK_SIZE=500
```

Optional (for AI enrichment):

```env
GROQ_API_KEY=your_groq_api_key_here
AI_MODEL=llama-3.1-8b-instant
```

Optional (if frontend is hosted on a different domain):

```env
CORS_ORIGIN=https://your-frontend-domain.vercel.app
VITE_API_BASE_URL=https://your-backend-domain.vercel.app
```

If frontend and backend are deployed together in the same Vercel project, you do not need `VITE_API_BASE_URL`; the frontend will call `/api/analyze` on the same domain.
