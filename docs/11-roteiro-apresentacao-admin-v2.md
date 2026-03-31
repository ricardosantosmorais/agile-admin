# 11 - Roteiro de Apresentação do Admin v2

## Objetivo
Servir como base para uma apresentação técnica e executiva do novo Admin v2.

## Estrutura sugerida

### 1. Contexto
- o legado centralizou operação por muitos anos;
- o custo de evolução ficou alto;
- o Admin v2 nasce para modernizar arquitetura e UX sem perder regras de negócio.

### 2. O que já mudou
- frontend em Next.js e React modernos;
- shell novo com menu real;
- i18n PT/EN;
- expiração de sessão com aviso e continuidade;
- múltiplos módulos já migrados;
- padrão de CRUD compartilhado.

### 3. O que foi preservado
- permissões por funcionalidade;
- contexto multiempresa;
- contratos de negócio;
- comportamento esperado das telas;
- integração com `api-v3`.

### 4. O que melhorou tecnicamente
- separação entre tela, regra e infraestrutura;
- bridges locais em `app/api`;
- componentes reutilizáveis;
- formulários e tabelas padronizados;
- base pronta para testes automatizados;
- base pronta para crescimento modular.

### 5. Diferenciais em relação ao legado
- controle global de sessão e multiabas;
- documentação viva desde o início;
- arquitetura preparada para AWS, GitHub Actions e E2E;
- melhor suporte para internacionalização;
- menos acoplamento entre backend local e frontend.

### 6. Cobertura atual
Mostrar módulos já migrados:
- pessoas;
- catálogo;
- conteúdo;
- dashboard;
- notificações.

### 7. Próximos passos
- produtos;
- contatos;
- testes automatizados;
- upload com backend/S3;
- refinamentos de UX e operação.

## Sugestão de narrativa
1. começar pelo problema do legado;
2. mostrar a nova arquitetura;
3. mostrar evidências de módulos reais já migrados;
4. mostrar ganhos de governança e manutenção;
5. encerrar com roadmap.

## Material de apoio recomendado
Para montar a apresentação futuramente, usar como fonte:
- [01-visao-geral.md](01-visao-geral.md)
- [03-autenticacao-sessao-multiempresa.md](03-autenticacao-sessao-multiempresa.md)
- [05-arquitetura-frontend-padroes.md](05-arquitetura-frontend-padroes.md)
- [06-modulos-e-cobertura-atual.md](06-modulos-e-cobertura-atual.md)
- [07-diferencas-para-o-legado.md](07-diferencas-para-o-legado.md)
