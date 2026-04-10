export type ChangelogItem = {
  id: string
  titulo: string
  descricao: string
}

export const shellChangelog: ChangelogItem[] = [
  {
    id: 'chg-001',
    titulo: 'Melhoria na visão do dashboard',
    descricao: 'Inclui filtros de período, exportação do painel e reorganização visual dos indicadores.',
  },
  {
    id: 'chg-002',
    titulo: 'Novo shell com menu agrupado',
    descricao: 'Agora o menu segue a estrutura do admin atual, com submenus e modo compacto.',
  },
]
