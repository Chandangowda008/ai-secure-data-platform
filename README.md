# AI Secure Data Intelligence Platform

Production-ready hackathon full-stack project focused on secure log intelligence.

This platform acts as:
- AI Gateway
- Data Scanner
- Log Analyzer (core)
- Risk Engine

## What it does
- Processes `.log` and `.txt` input from text box or file upload
- Parses logs line-by-line
- Detects:
  - Emails
  - Phone numbers
  - API keys (`sk-...` and common key formats)
  - Passwords
  - Tokens
  - Stack traces / exceptions
  - Failed login patterns
  - Suspicious injection/path traversal patterns
- Returns findings with:
  - `type`
  - `risk` (`low`, `medium`, `high`, `critical`)
  - `line`

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
The system generates concrete, high-signal insights using Ollama-enhanced interpretation with rule-based fallback, including examples like:
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
├── .env.example
├── .gitignore
├── index.js
└── package.json
```

## Frontend
React + Vite UI provides:
- Text input mode or file upload mode (`.log`, `.txt`)
- Analyze button
- Results panel with:
  - Highlighted risk level
  - Findings with line numbers
  - Insights panel
- Bonus: risky-line highlighting with severity colors
  - Red: critical
  - Orange: high
  - Yellow: medium

## API
### POST `/api/analyze`

Request (text/log):

```json
{
  "input_type": "text",
  "content": "2026-03-24 ERROR api_key=sk-1234567890abcdefghijklmnop"
}
```

Request (file):
- `multipart/form-data`
- field `input_type=file`
- field `file=<.log or .txt file>`

Response:

```json
{
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
  "insights": [
    "API key exposed in logs (1 occurrence)."
  ]
}
```

## Local setup

### 1) Backend

```bash
cd backend
npm install
```

Create env file:

```powershell
Copy-Item .env.example .env
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

If needed, set `VITE_API_BASE_URL` in frontend env to backend URL.

## Security and scalability controls
- Input validation for `input_type` and content/file mode
- Upload guardrails for extension and file size
- JSON size limits
- Chunked async line processing to reduce event loop blocking
- Stable error handling for malformed input and unsupported uploads

## Example test inputs
- `examples/sample.log`
- `examples/sample.txt`

## Optional Ollama configuration
In `backend/.env`:

```env
OLLAMA_MODEL=llama3
OLLAMA_HOST=http://127.0.0.1:11434
```

If Ollama is unavailable, rule-based insights and actions are returned.

## Quick verification
1. Start backend and frontend.
2. Analyze `examples/sample.log` (paste or upload).
3. Confirm findings include `type`, `risk`, and `line`.
4. Confirm risk score follows severity scoring map.
5. Confirm insights are concrete and non-generic.

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
JSON_LIMIT=10mb
```

Optional (for Ollama enrichment):

```env
OLLAMA_MODEL=llama3
OLLAMA_HOST=http://127.0.0.1:11434
```

Optional (if frontend is hosted on a different domain):

```env
CORS_ORIGIN=https://your-frontend-domain.vercel.app
VITE_API_BASE_URL=https://your-backend-domain.vercel.app
```

If frontend and backend are deployed together in the same Vercel project, you do not need `VITE_API_BASE_URL`; the frontend will call `/api/analyze` on the same domain.
