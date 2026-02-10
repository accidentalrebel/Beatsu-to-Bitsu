#!/usr/bin/env bash
set -e
npm run build
npx wrangler pages deploy dist --project-name beatsu-to-bitsu
