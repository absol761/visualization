# Infinite Notes (Student Edition)

Student-first visual note-taking workspace built with React + Vite. The editor is a pure WYSIWYG experience powered by Quill, and every note lives on an infinite canvas that students can zoom, pan, and organize like a real desk.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Copy the env template and add your secrets**
   ```bash
   cp env.sample .env
   ```
   Fill in your Firebase project settings plus the Gemini API key. `.env` is ignored by git so keys stay private.
3. **Run the dev server**
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project id |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender id |
| `VITE_FIREBASE_APP_ID` | Firebase app id |
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI helpers |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Security Notes

- `.env`, `.env.local`, and environment-specific files are already ignored in `.gitignore`.
- Share `env.sample` instead of a real `.env` when creating public repos.
