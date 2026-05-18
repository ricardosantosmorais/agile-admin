import { describe, expect, it } from 'vitest'
import { getMenuItems } from '@/src/components/navigation/menu-items'
import type { AuthSession } from '@/src/features/auth/types/auth'

describe('getMenuItems', () => {
  it('maps the dynamic SAC menu to the same four surfaces exposed by the legacy admin', () => {
    const session = {
      token: 'token',
      currentTenant: { id: 'empresa-1', nome: 'Empresa', codigo: '1', status: 'ativo' },
      tenants: [],
      user: {
        id: 'u1',
        nome: 'User',
        email: 'user@test.local',
        cargo: '',
        avatarFallback: 'U',
        ultimoAcesso: '',
        master: false,
        funcionalidades: [
          { id: 'sac', nome: 'SAC', chave: 'SAC', slug: 'sac', componente: 'sac', ativo: true, menu: true, nivel: 1, posicao: 1 },
          { id: 'sac-dashboard', nome: 'Dashboard', chave: 'SAC_DASHBOARD', slug: 'SAC_DASHBOARD', componente: 'sac-dashboard', ativo: true, menu: true, nivel: 2, posicao: 1, idFuncionalidadePai: 'sac' },
          { id: 'sac-chamados', nome: 'Chamados', chave: 'SAC_CHAMADOS', slug: 'SAC_CHAMADOS', componente: 'sac-chamados', ativo: true, menu: true, nivel: 2, posicao: 2, idFuncionalidadePai: 'sac' },
          { id: 'sac-areas-assuntos', nome: 'Áreas/Assuntos', chave: 'SAC_AREAS_ASSUNTOS', slug: 'SAC_AREAS_ASSUNTOS', componente: 'sac-areas-assuntos', ativo: true, menu: true, nivel: 2, posicao: 3, idFuncionalidadePai: 'sac' },
          { id: 'sac-configuracoes', nome: 'Configurações', chave: 'SAC_CONFIGURACOES', slug: 'SAC_CONFIGURACOES', componente: 'sac-configuracoes', ativo: true, menu: true, nivel: 2, posicao: 4, idFuncionalidadePai: 'sac' },
        ],
      },
    } satisfies AuthSession

    const sacMenu = getMenuItems(session, 'pt-BR').find((item) => item.label === 'SAC')

    expect(sacMenu?.children?.map((item) => ({ label: item.label, to: item.to }))).toEqual([
      { label: 'Dashboard', to: '/sac/dashboard' },
      { label: 'Chamados', to: '/sac/chamados' },
      { label: 'Áreas/Assuntos', to: '/sac/areas-assuntos' },
      { label: 'Configurações', to: '/sac/configuracoes' },
    ])
  })
})
