# ADR-008 - Editor SQL como página operacional com persistência local

## Status
Aceita

## Contexto
`Ferramentas > Editor SQL` não se encaixa em CRUD tradicional e depende de ergonomia de ferramenta operacional.

Além disso:
- a integração não usa a `api-v3`;
- o backend disponível hoje não oferece estrutura adicional para histórico por aba;
- era importante melhorar a experiência sem depender de mudanças no backend.

## Decisão
O Editor SQL foi tratado como página operacional própria, com:
- Monaco;
- múltiplas abas;
- fullscreen;
- painéis redimensionáveis;
- resultado em tabela ou JSON;
- persistência local do workspace no navegador, por usuário e tenant.

## Consequências

### Positivas
- o módulo fica mais próximo de ferramentas de mercado;
- o usuário não perde facilmente o trabalho entre sessões do navegador;
- a evolução do editor pode continuar no frontend sem bloqueio do backend.

### Custos
- o estado persistido é local da máquina e do navegador;
- a sincronização de workspace não existe entre dispositivos;
- o editor exige cuidado especial para evitar flicker e regressões na digitação.

## Impacto
Essa decisão afeta:
- `sql-editor-page`;
- `sql-editor-monaco`;
- `sql-editor-workspace`;
- documentação de ambiente das APIs externas;
- futuras evoluções do editor puramente no frontend.
