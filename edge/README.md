# Área Aprenda do ShelfFlow

Preparação para servir o blog em `https://shelfflow.com.br/aprenda/`, com artigos em `/aprenda/posts/` e comparações em `/aprenda/compare/`. O Pages continua sendo a origem dos arquivos; o endereço público passa ao domínio principal. O Worker reescreve links, fontes, busca, canonical, RSS e sitemap. Cookies e autorização do aplicativo não são encaminhados à origem pública.

A página inicial é delegada por service binding ao Worker existente `shelfflow-use`, preservando captação e selo Meta. Uma única entrada Aprenda é acrescentada ao menu. O Worker novo assume somente as rotas `/aprenda*` e `/`; `/use*` continua no Worker de captação. Em futuras publicações do Worker `shelfflow-use`, não reassociar `/` a ele: a rota raiz passa a pertencer ao `shelfflow-learn`.

## Ativação

O workflow **Activate Aprenda on the primary domain** executa após o deploy normal do Pages em main e também aceita acionamento manual. Ele testa o Worker, publica sem rotas, ativa `/aprenda*`, verifica o artigo e o canonical, ativa o menu da raiz e verifica também o selo Meta. Se uma verificação falhar, restaura as rotas anteriores. O middleware permanente só redireciona os endereços antigos quando a área Aprenda responde ao HEAD com sucesso e o marcador do Worker; preserva query strings de rastreio. A área de edição `/admin` e sua autenticação ficam no subdomínio antigo.

Token no secret `CLOUDFLARE_API_TOKEN`: manter acesso ao Pages; acrescentar Workers Admin para criar o novo Worker (ou acesso legado equivalente), Workers Routes Write e Zone Read restritos a `shelfflow.com.br`. Account ID já configurado. O workflow não lê nem exibe valores dos secrets.

O arquivo `edge-route-backup.json`, disponibilizado como artefato da execução, registra os destinos anteriores. Para rollback, restaurar as rotas do snapshot; o middleware passa a servir o blog antigo assim que a rota principal deixa de responder com o marcador do Worker.

## Conteúdo

Os oito guias e quatro comparações foram antecipados para 16/11/2026; as datas originais estão em `originalDate` nos manifestos. A distribuição nas redes continua escalonada. A ativação não muda as URLs canônicas enquanto não houver uma rota funcional.

O middleware está versionado em functions/_middleware.js. A migração só estará concluída após conferir publicamente links, arquivos, menu e redirecionamentos.
