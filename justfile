set shell := ["bash", "-euo", "pipefail", "-c"]

cargo_manifest := "src-tauri/Cargo.toml"

# List recipes
default:
    @just --list --unsorted

# Install dependencies
install:
    bun install

# Run the app with hot reload
dev:
    bun tauri dev

# Build the release app bundle for this machine
build:
    bun tauri build

# Type-check the frontend and the Rust code
check:
    bunx tsc --noEmit
    cargo check --manifest-path {{cargo_manifest}}

# Run the frontend and Rust tests
test:
    bun run test
    cargo test --manifest-path {{cargo_manifest}}

# Format and lint the Rust code
lint:
    cargo fmt --manifest-path {{cargo_manifest}} --check
    cargo clippy --manifest-path {{cargo_manifest}} -- -D warnings

# Set the app version everywhere, e.g. `just version 0.2.0`
version new:
    scripts/set-version.sh {{new}}

# Tag the current version on main and push the tag to start a release
release:
    #!/usr/bin/env bash
    set -euo pipefail
    v=$(jq -r '.version' src-tauri/tauri.conf.json)
    [ "$(git branch --show-current)" = main ] || { echo "Switch to main first." >&2; exit 1; }
    [ -z "$(git status --porcelain)" ] || { echo "Working tree is not clean." >&2; exit 1; }
    git fetch origin main --quiet
    [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" ] || { echo "main is not in sync with origin/main." >&2; exit 1; }
    read -rp "Tag and push v$v? [y/N] " ok
    [ "$ok" = y ] || exit 1
    git tag "v$v"
    git push origin "v$v"
