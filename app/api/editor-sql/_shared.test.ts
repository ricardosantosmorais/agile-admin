import { beforeEach, describe, expect, it, vi } from 'vitest'
import { executeSqlAgainstExternalApi } from '@/app/api/editor-sql/_shared'

const { externalAdminApiFetchMock } = vi.hoisted(() => ({
  externalAdminApiFetchMock: vi.fn(),
}))

vi.mock('@/src/services/http/external-admin-api', () => ({
  externalAdminApiFetch: externalAdminApiFetchMock,
}))

describe('editor-sql shared bridge', () => {
  beforeEach(() => {
    externalAdminApiFetchMock.mockReset()
    externalAdminApiFetchMock.mockResolvedValue({ ok: true, status: 200, payload: { data: [] } })
  })

  it('executa consultas ERP pelo PainelB2BApi mesmo quando o legado marcava integracao API', async () => {
    await executeSqlAgainstExternalApi(
      {
        token: 'token',
        tenantId: 'empresa-1',
        tenantCodigo: 'codigo-empresa',
        currentUserId: 'user-1',
        useAgileSyncForErp: true,
      },
      {
        fonteDados: 'erp',
        sql: 'select 1',
        page: 1,
        perPage: 100,
      },
    )

    expect(externalAdminApiFetchMock).toHaveBeenCalledWith('painelb2b', 'agilesync_editorsql', expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        id_empresa: 'codigo-empresa',
        fonte_dados: 'erp',
        sql: 'select 1',
      }),
    }))
  })

  it('mantem empresa selecionada manualmente no alvo PainelB2BApi', async () => {
    await executeSqlAgainstExternalApi(
      {
        token: 'token',
        tenantId: 'empresa-1',
        tenantCodigo: 'codigo-empresa',
        currentUserId: 'user-1',
        useAgileSyncForErp: false,
      },
      {
        idEmpresa: 'outra-empresa',
        fonteDados: 'agilesync',
        sql: 'select 1',
        page: 2,
        perPage: 50,
      },
    )

    expect(externalAdminApiFetchMock).toHaveBeenCalledWith('painelb2b', 'agilesync_editorsql', expect.objectContaining({
      body: expect.objectContaining({
        id_empresa: 'outra-empresa',
        page: 2,
        perpage: 50,
        offset: 50,
      }),
    }))
  })
})
