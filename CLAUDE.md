# Invoice Buddy

## Package Manager
This project uses **bun** as the package manager and script runner. Always use `bun` instead of `npm`/`npx`/`yarn`.

- Install deps: `bun install`
- TypeScript check: `bunx tsc --noEmit`
- Dev server: `bun run dev`
- Rust check: `cargo check --manifest-path src-tauri/Cargo.toml`

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + React Router
- **Backend**: Rust / Tauri v2
- **Database**: SQLite via rusqlite
- **PDF**: @react-pdf/renderer
- **Validation**: Zod

## Conventions
- Money is stored as integer cents (i64 in Rust, number in TS)
- Quantities and tax rates are stored as x100 integers (e.g. 1000 = 10.00%)
- Frontend types live in `src/features/<domain>/types.ts`
- API calls use Tauri `invoke()` in `src/features/<domain>/api.ts`
- Rust follows repository pattern: models → repositories → commands
