#!/bin/bash
# Publicar novo artigo no ShelfFlow Blog
# Uso: ./publish.sh "Descrição do que mudou"
cd "$(dirname "$0")"
MSG="${1:-Atualização do blog $(date +%Y-%m-%d)}"
git add -A
git commit -m "$MSG"
git push
echo ""
echo "Push feito! O Cloudflare Pages vai fazer o deploy automaticamente."
echo "Ou rode ./deploy.sh para publicar manualmente."
