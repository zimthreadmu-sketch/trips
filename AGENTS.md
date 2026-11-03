# FleetPulse & Trips Project Agent Guidelines

## STRICT PROJECT IDENTITY RULE
- **Primary & Sole Account Email**: `zimthreadmu@gmail.com`
- **Scope**: This project (`trips` / `FleetPulse`) is EXCLUSIVELY associated with the account using the email **`zimthreadmu@gmail.com`**.
- **Services Covered**:
  1. **GitHub**: All repositories, git commits, push targets, and GitHub CLI operations MUST be authenticated with the GitHub account associated with `zimthreadmu@gmail.com`.
  2. **Neon Database**: All database branches, projects, claims, and credentials MUST belong to the Neon account registered to `zimthreadmu@gmail.com`.
  3. **Vercel**: All projects, deployments, domains, and environment variables MUST be deployed under the Vercel account tied to `zimthreadmu@gmail.com`.
  4. **Any Third-Party Tools & Services**: Cloud services, object stores, API keys, and external integrations MUST use `zimthreadmu@gmail.com`.
- **Enforcement**: NEVER switch to or deploy under any other user profile (e.g., `Mupesa`, `anesu-metabox`, or `sharonremotedeveloper`) for this project.

---

## Technical Stack & Workflow
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript.
- **Styling**: Tailwind CSS with custom dark obsidian theme (#090A0F, #12141C).
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`).
- **Deployment**: Vercel linked to the repository under `zimthreadmu@gmail.com`.
- **Git Config**:
  - `user.email`: `zimthreadmu@gmail.com`
  - `user.name`: `Zimthread`
