# graphql-boilerplate
Um projeto boilerplate para um servidor Graphql

# que isso?
Uma API Graphql simples com um CRUD de usuários. As mutações (updates e deletes) são protegidas por token (JWT).
O micro-framework proposto visa facilitar a criação de
outras funcionalidades e recursos.

# como usar?
- Instale as dependências com `npm i`
- Para rodar em dev
  - Inicie um processo com `npm run gulp`. Esse comando irá compilar todos os arquivos `.ts`, criando a pasta `dist`
  - Inicie outro processo com o comando `npm run dev`. Esse comando irá iniciar um servidor escutando no localhost, porta 3000. Acessando `localhost:3000` no seu navegador favorito, a "IDE" GraphiQL irá aparecer. Essa aplicação da acesso a um editor de texto para testar as queries e mutations, documentação do schema, histórico de queries, entre outros.
- Testes!
  - Para testar, basta rodar o comando `npm test`
  - Para gerar o relatório de code coverage (cobertura de testes), basta rodar o comando `npm run coverage`. Esse comando irá gerar um `index.html` dentro da pasta `/coverage`. Basta abrir esse arquivo no seu browser favorito utilizando o protocolo de arquivos (`file://caminho_para_o_projeto/coverage/index.html`)

# tools & features

- Express
- Typescript
- Sequelize como ORM
  - MySQL como BD
- Schema Graphql modularizado
- Testado com Mocha, Chai e com relatórios de code coverage (Instanbul <3)
- Winston como biblioteca de log
- Dataloaders para otimização de requisições em batch
- Uso do RequestedFields para otimizar as consultas a banco
- Em breve: pronto para deploy na nuvem

# importante!
Esse projeto é uma versão reduzida do projeto final dado no curso de APIs GraphQL dado pelo Plínio Naves (plataforma Udemy). Ótimo curso e ótimo professor, recomendo. Criei esse projeto para agilizar o início de outras projetos utilizando o GraphQL!
