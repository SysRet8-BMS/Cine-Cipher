Cine-Cipher

A fast-paced, timed trivia game about music and cinema. Players answer creative clues (instrumental tunes, translated lyrics, images, or story summaries) and earn points for streaks of correct answers. The app is designed for serverless deployment on Netlify.

## Features
- Timed trivia gameplay
- Music and cinema questions
- Streak-based scoring system
- Leaderboard for top players
- Modern UI with React
- Serverless backend (Netlify Functions)

## Project Structure
```
GUESS-IT-RIGHT/
├── apps/
│   └── web/           # Frontend (React + Vite)
├── packages/
│   └── shared/        # Shared types/models (TypeScript)
├── netlify/
│   └── functions/     # Backend (Netlify Functions)
├── netlify.toml       # Netlify config and redirects
├── setup.md           # Quickstart setup guide
├── README.md          # Project overview
└── ...                # Other config files
```

## Architecture
- **Monorepo** managed with pnpm workspaces
- **Frontend**: React + Vite app in `apps/web`
- **Backend**: Netlify Functions in `netlify/functions` (main function: `game-api`)
- **Shared**: Common types/interfaces in `packages/shared`
- **Netlify glue**: `netlify.toml` configures build, functions, and API redirects

### How it works
- The frontend only calls `/api/*` endpoints (never talks to the DB directly)
- Netlify redirects `/api/*` to the `game-api` function
- The backend handles:
  - `GET /api/question` – returns a question clue
  - `POST /api/answer` – checks answer, updates score/streak
  - `GET /api/leaderboard` – returns top scores
- Intended to use Netlify DB for storing questions and scores

## Local Development
1. Install prerequisites:
   - Node.js 18+
   - pnpm (install globally: `npm install -g pnpm`)
2. Clone the repo and install dependencies:
   ```bash
   git clone <YOUR_REPO_URL>.git
   cd GUESS-IT-RIGHT
   pnpm install
   ```
3. Start the app (frontend + backend):
   ```bash
   pnpm run dev
   ```
   This runs Netlify locally, serving both the React frontend and the API function. Open the URL shown in the terminal (usually `http://localhost:8888`).
4. Optional commands:
   - Type check: `pnpm typecheck -r`
   - Lint: `pnpm lint -r`
   - Build: `pnpm build`

See `setup.md` for a step-by-step guide.

## Deployment
- The app is designed for Netlify. It connects the repo to Netlify.
- Netlify will use `netlify.toml` to build and deploy:
  - Build command: `pnpm install && pnpm build`
  - Publish directory: `apps/web/dist`
  - Functions directory: `netlify/functions`

## License
MIT
