#!/bin/bash
# Deploy ShelfFlow Blog to Cloudflare Pages
cd "$(dirname "$0")"
npm run build && npx wrangler pages deploy dist --project-name shelfflow-blog --commit-dirty=true
