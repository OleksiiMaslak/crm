# GitHub CRM

A project management system for public GitHub repositories.  
Users can register, log in, and manage a personal list of GitHub repos — with live data fetched directly from the GitHub API.

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 19, TypeScript, Redux Toolkit, Ant Design |
| Backend  | NestJS 11, TypeScript                           |
| Auth DB  | PostgreSQL 16 + Prisma ORM                      |
| Repo DB  | MongoDB 7 + Mongoose                           |
| DevOps   | Docker, Docker Compose                          |

## Features

- **Auth** — register / login via email + password, JWT access token + httpOnly refresh cookie
- **Repository list** — owner, name, URL, stars, forks, open issues, created date
- **Add repository** — enter `owner/name` (e.g. `facebook/react`), data is fetched from GitHub API and saved
- **Refresh** — re-fetch latest stats from GitHub with one click
- **Delete** — remove a repository from your list
- **Filters** — search by name/owner/URL, filter by language and star count
- **i18n** — English / Ukrainian language switcher

## Quick Start (Docker)

> Requires Docker and Docker Compose.

```bash
# 1. Clone the repository
git clone https://github.com/OleksiiMaslak/crm.git
cd crm

# 2. Build images and start all services
docker compose up --build
```

The app will be available at **http://localhost:5173**  
The API will be available at **http://localhost:3000/api**

Docker Compose uses dedicated env files [server/.env.docker](server/.env.docker) and [client/.env.docker](client/.env.docker), so personal values in [server/.env](server/.env) do not affect container startup.

On startup, the server container automatically applies Prisma migrations (`prisma migrate deploy`) before launching NestJS.


## Local Development (without Docker)

### Prerequisites

- Node.js 22+
- PostgreSQL 16
- MongoDB 7

### 1. Server

```bash
cd server
cp .env.example .env
# Edit .env — set DATABASE_URL and MONGO_URI to your local instances

npm install
npm run prisma:migrate   # run DB migrations
npm run start:dev
```

### 2. Client

```bash
cd client
cp .env.example .env
# VITE_API_URL=http://localhost:3000/api (default)

npm install
npm run dev
```

## Environment Variables

### `server/.env`

| Variable               | Description                                     | Default                                                         |
| ---------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `PORT`                 | Server port                                     | `3000`                                                          |
| `CLIENT_URL`           | Allowed CORS origin                             | `http://localhost:5173`                                         |
| `JWT_SECRET`           | Secret for signing access tokens                | —                                                               |
| `JWT_EXPIRES_IN`       | Access token lifetime                           | `15m`                                                           |
| `JWT_REFRESH_SECRET`   | Secret for signing refresh tokens               | —                                                               |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime                        | `7d`                                                            |
| `DATABASE_URL`         | PostgreSQL connection string                    | `postgresql://crm_user:crm_password@localhost:5433/crm?schema=public` |
| `MONGO_URI`            | MongoDB connection string                       | `mongodb://localhost:27017/crm`                                 |
| `GITHUB_TOKEN`         | GitHub personal access token. Leave empty if you do not have one; the app still works with anonymous GitHub API access, but with stricter rate limits. | — |

### `server/.env.docker`

Used only by Docker Compose.

| Variable               | Default                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `PORT`                 | `3000`                                                          |
| `CLIENT_URL`           | `http://localhost:5173`                                         |
| `JWT_SECRET`           | `super-secret-key`                                              |
| `JWT_EXPIRES_IN`       | `15m`                                                           |
| `JWT_REFRESH_SECRET`   | `super-secret-refresh-key`                                      |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                                                          |
| `DATABASE_URL`         | `postgresql://crm_user:crm_password@postgres:5432/crm?schema=public` |
| `MONGO_URI`            | `mongodb://mongo:27017/crm`                                     |
| `GITHUB_TOKEN`         | empty                                                           |

### `client/.env`

| Variable        | Description         | Default                      |
| --------------- | ------------------- | ---------------------------- |
| `VITE_API_URL`  | Backend API base URL | `http://localhost:3000/api` |

### `client/.env.docker`

Used only by Docker Compose.

| Variable        | Default                      |
| --------------- | ---------------------------- |
| `VITE_API_URL`  | `http://localhost:3000/api` |

## Project Structure

```
crm/
├── client/                  # React frontend
│   └── src/
│       ├── api/             # Axios instances & API wrappers
│       ├── components/      # Shared UI components
│       ├── pages/           # Route-level page components
│       ├── store/           # Redux slices & store config
│       └── i18n.ts          # i18next translations (EN / UK)
├── server/                  # NestJS backend
│   └── src/
│       ├── auth/            # Registration, login, JWT, refresh
│       ├── prisma/          # Prisma service
│       └── repositories/    # GitHub repo CRUD + GitHub API client
├── docker-compose.yml
└── README.md
```

## API Overview

### Auth — `/api/auth`

| Method | Path       | Description                  |
| ------ | ---------- | ---------------------------- |
| POST   | `/register` | Create account               |
| POST   | `/login`    | Log in, receive access token |
| POST   | `/refresh`  | Rotate tokens                |
| POST   | `/logout`   | Clear refresh cookie         |

### Repositories — `/api/repositories` (requires JWT)

| Method | Path              | Description                          |
| ------ | ----------------- | ------------------------------------ |
| GET    | `/`               | List all repositories for current user |
| POST   | `/`               | Add repository by `owner` + `name`   |
| DELETE | `/:id`            | Delete repository                    |
| PATCH  | `/:id/refresh`    | Re-fetch data from GitHub API        |
