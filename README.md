# Invoice Buddy

A fast, local-first desktop app for creating and managing invoices. Built with Tauri, React, and SQLite — all data stays on your machine.

## Install

Download the installer for macOS, Windows or Linux from **[the Invoice Buddy site](https://clarkeandrew.github.io/invoice-buddy/)**, or from [GitHub Releases](https://github.com/clarkeandrew/invoice-buddy/releases/latest). The builds aren't signed with an Apple or Microsoft certificate yet, so the site explains how to get past the warning the first time you open the app. After that, the app updates itself.

## Features

- Create and manage clients, invoices, and line items
- Export invoices as PDF
- Local SQLite database — no cloud, no accounts
- Cross-platform: macOS (Apple Silicon), Windows, Linux

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Rust, Tauri v2
- **Database:** SQLite (rusqlite)
- **PDF:** @react-pdf/renderer

## Development

Requires [Bun](https://bun.sh), [Rust](https://rustup.rs), [just](https://just.systems), `jq`, and the [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/).

```sh
just install   # install dependencies
just dev       # run the app with hot reload
just check     # type-check frontend and Rust
just test      # run the frontend and Rust tests
just build     # build the app bundle for this machine
```

Run `just` to list every recipe.

## Releasing

```sh
just version 0.2.0   # set the version, then commit and merge to main
just release         # on main: tag v0.2.0 and push it
```

Pushing the tag builds macOS, Windows and Linux bundles in GitHub Actions and publishes them as a GitHub Release. The [download site](https://clarkeandrew.github.io/invoice-buddy/) links to the latest release on its own, and installed apps offer the update the next time they start. The site itself is in `docs/` and deploys when that folder changes on `main`.

## License

MIT
