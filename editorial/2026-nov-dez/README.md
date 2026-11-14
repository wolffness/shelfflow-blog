# ShelfFlow — novembro e dezembro de 2026

São oito artigos e quatro comparações, com dezoito temas sociais adaptados para Instagram, Facebook, LinkedIn e Threads. Os registros do Ocoya são a evidência do agendamento social; os arquivos de planejamento sozinhos não confirmam publicação.

## Publicação do blog

Os artigos usam `src/data/blog` e as comparações `src/data/comparisons`. As datas são 06h no fuso America/Sao_Paulo. Em produção, conteúdo futuro não gera página, imagem OG, RSS, arquivo ou listagem. O modo de desenvolvimento permite prévia.

O workflow `editorial-release.yml` verifica o calendário às 06h15 BRT de segunda a sexta. Na primeira execução após a data prevista, grava um marcador de liberação e faz um commit em `main`, acionando a integração GitHub do Cloudflare Pages. O horário efetivo depende da fila do GitHub e da conclusão do build. Uma repetição não cria outro marcador. Se um dia falhar, a próxima execução recupera as datas anteriores.

Validação: `node scripts/editorial-release.test.mjs`; `npm run lint`; `npm run build`. O teste usa arquivos temporários, verifica exclusão de conteúdo futuro e idempotência. A execução local do build em 14/11 passou pelo Astro check, mas foi bloqueada ao buscar fontes do Google por ausência de rede; o build remoto precisa confirmar a compilação integral.

## Comparações

As quatro páginas ficam em `https://blog.shelfflow.com.br/compare/`. A inclusão da aba Compare no site principal é uma etapa posterior do site. As fontes foram consultadas em 14/11/2026. As avaliações são documentais, sem alegação de teste instalado dos aplicativos concorrentes.

## Redes e mensuração

Horários BRT: LinkedIn 09h, Instagram 10h, Facebook 10h15 e Threads 12h. Facebook e LinkedIn usam links gerados por `tracking_link` no BrainFlow. Instagram usa o endereço de captação; o link da bio depende da configuração do perfil. Threads está no Ocoya, mas o calendário editorial do BrainFlow ainda não aceita esse canal.

As artes são ilustrações conceituais, não capturas reais da interface. Algumas artes aprovadas foram reutilizadas em temas relacionados. Rascunhos antigos e alternativas descartadas não fazem parte dos agendamentos confirmados.
