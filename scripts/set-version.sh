#!/usr/bin/env bash
# Set the app version in tauri.conf.json, Cargo.toml, Cargo.lock and package.json.
# Usage: scripts/set-version.sh 0.2.0
set -euo pipefail

version="${1:-}"
if ! [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "usage: $0 <major.minor.patch>" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

tmp=$(mktemp)
jq --arg v "$version" '.version = $v' src-tauri/tauri.conf.json > "$tmp" && mv "$tmp" src-tauri/tauri.conf.json
jq --arg v "$version" '.version = $v' package.json > "$tmp" && mv "$tmp" package.json

# Only the [package] table's version, not dependency versions.
sed -i.bak '/^\[package\]/,/^\[/s/^version = ".*"/version = "'"$version"'"/' src-tauri/Cargo.toml
rm src-tauri/Cargo.toml.bak

# Refresh the crate's own entry in Cargo.lock so `cargo build --locked` passes.
cargo update --offline --manifest-path src-tauri/Cargo.toml -p invoice-buddy >/dev/null 2>&1 \
  || cargo metadata --format-version 1 --manifest-path src-tauri/Cargo.toml >/dev/null

echo "Version set to $version. Commit it, merge it, then: git tag v$version && git push origin v$version"
