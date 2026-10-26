# E2E de segurança

A suíte usa Playwright com Chromium e exercita o frontend real no navegador.
As respostas da fronteira `/api` são controladas por `page.route`, usando
somente usuários, senhas e cookies sintéticos. Isso torna os testes
reproduzíveis e evita credenciais institucionais em código, traces ou relatórios.

## Execução local

```bash
npx playwright install chromium
npm run test:e2e
```

O Playwright inicia `npm run dev` em `http://localhost:3001`. Para executar
contra uma instância frontend já iniciada, defina `PLAYWRIGHT_BASE_URL`; a suíte
continua simulando exclusivamente as respostas `/api`.

## Cobertura

- bootstrap CSRF anterior ao login;
- payload opaco com `identifier`, sem `username`;
- login válido e cookie de sessão HttpOnly;
- falha genérica para identificador inexistente, senha inválida, usuário
  inativo e acesso recusado;
- throttling e indisponibilidade;
- sessão expirada, revogada, inativa e com contexto divergente;
- proteção contra open redirect;
- logout seletivo com CSRF.

Esta suíte comprova a integração browser/frontend na fronteira documentada. Um
teste full-stack com Django e PostgreSQL reais continua sendo uma camada
adicional, dependente de ambiente efêmero, fixtures backend e isolamento de
banco aprovados.
