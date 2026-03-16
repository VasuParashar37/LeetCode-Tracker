# LeetCode Tracker

Track solved LeetCode problems, revision cadence, and question history with a React frontend and Supabase backend.

Live app: https://leet-code-tracker-green.vercel.app

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase Postgres

## Features

- Email sign up and sign in
- Password reset flow
- Save solved questions to Supabase
- Track revision count and next revision date
- Persist question activity history
- Search across saved questions

## Local Development

1. Install dependencies:

```sh
npm install
```

2. Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

3. Start the dev server:

```sh
npm run dev
```

## Build

```sh
npm run build
```

## Supabase Setup

You need:

- a `questions` table
- a `question_history` table
- Supabase Auth enabled
- redirect URLs configured for local and production environments

SQL for `question_history` is available in [supabase/question_history.sql](/Users/vasuparashar03/Documents/LeetCode%20Tracker/supabase/question_history.sql).

## Production URL

- https://leet-code-tracker-green.vercel.app
