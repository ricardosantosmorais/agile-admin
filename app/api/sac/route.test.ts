import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET as getDashboard } from '@/app/api/sac/dashboard/route'
import { GET as listTickets } from '@/app/api/sac/chamados/route'
import { GET as getTicketDetail } from '@/app/api/sac/chamados/[id]/route'
import { POST as runTicketAction } from '@/app/api/sac/chamados/[id]/action/route'
import { GET as listAreas } from '@/app/api/sac/areas/route'
import { POST as saveArea } from '@/app/api/sac/areas/route'
import { DELETE as deleteArea } from '@/app/api/sac/areas/[id]/route'
import { GET as listAreaResponsibles } from '@/app/api/sac/areas/[id]/responsaveis/route'
import { POST as saveAreaResponsible } from '@/app/api/sac/areas/[id]/responsaveis/route'
import { DELETE as deleteAreaResponsible } from '@/app/api/sac/areas/responsaveis/[id]/route'
import { GET as listSubjects } from '@/app/api/sac/assuntos/route'
import { POST as saveSubject } from '@/app/api/sac/assuntos/route'
import { DELETE as deleteSubject } from '@/app/api/sac/assuntos/[id]/route'
import { GET as getConfig } from '@/app/api/sac/configuracoes/route'
import { POST as saveConfig } from '@/app/api/sac/configuracoes/route'
import { GET as listUsers } from '@/app/api/sac/usuarios/route'

const {
  readAuthSessionMock,
  serverApiFetchMock,
  s3SendMock,
  putObjectCommandMock,
} = vi.hoisted(() => ({
  readAuthSessionMock: vi.fn(),
  serverApiFetchMock: vi.fn(),
  s3SendMock: vi.fn(),
  putObjectCommandMock: vi.fn((input: Record<string, unknown>) => ({ input })),
}))

vi.mock('@/src/features/auth/services/auth-session', () => ({
  readAuthSession: readAuthSessionMock,
}))

vi.mock('@/src/services/http/server-api', () => ({
  serverApiFetch: serverApiFetchMock,
}))

vi.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: putObjectCommandMock,
  S3Client: vi.fn(() => ({ send: s3SendMock })),
}))

describe('sac admin routes', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    serverApiFetchMock.mockReset()
    s3SendMock.mockReset()
    putObjectCommandMock.mockClear()
    readAuthSessionMock.mockResolvedValue({
      token: 'session-token',
      currentTenantId: 'empresa-1',
    })
    vi.stubEnv('UPLOAD_S3_ACCESS_KEY_ID', 'access-key')
    vi.stubEnv('UPLOAD_S3_SECRET_ACCESS_KEY', 'secret-key')
    s3SendMock.mockResolvedValue({})
    serverApiFetchMock.mockResolvedValue({ ok: true, status: 200, payload: { data: {} } })
  })

  it('forwards dashboard period filters to api v3 SAC dashboard', async () => {
    const response = await getDashboard(new Request('http://localhost/api/sac/dashboard?data_inicial=2026-05-01&data_final=2026-05-07&id_usuario_responsavel=15'))

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'sac/admin/dashboard?data_inicial=2026-05-01&data_final=2026-05-07&id_usuario_responsavel=15',
      expect.objectContaining({ method: 'GET', token: 'session-token', tenantId: 'empresa-1' }),
    )
  })

  it('forwards legacy ticket list filters and default ordering', async () => {
    const response = await listTickets(new Request('http://localhost/api/sac/chamados?status=pendentes_atuacao&cliente=alfa&protocolo=SAC&page=3&perpage=20'))

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'sac/admin/chamados?page=3&perpage=20&order=ultima_interacao_em&sort=desc&status=pendentes_atuacao&cliente=alfa&protocolo=SAC',
      expect.objectContaining({ method: 'GET', token: 'session-token', tenantId: 'empresa-1' }),
    )
  })

  it('loads a ticket detail by id through the tenant bridge', async () => {
    const response = await getTicketDetail(new Request('http://localhost/api/sac/chamados/42'), { params: Promise.resolve({ id: '42' }) })

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'sac/admin/chamados/42',
      expect.objectContaining({ method: 'GET', token: 'session-token', tenantId: 'empresa-1' }),
    )
  })

  it('maps v2 action names to api v3 SAC ticket endpoints', async () => {
    const response = await runTicketAction(new Request('http://localhost/api/sac/chamados/42/action', {
      method: 'POST',
      body: JSON.stringify({ action: 'respond', mensagem: 'Resposta ao cliente', status: 'aguardando_cliente', updated_at: '2026-05-07 10:00:00' }),
    }), { params: Promise.resolve({ id: '42' }) })

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'sac/admin/chamados/42/responder',
      expect.objectContaining({
        method: 'POST',
        token: 'session-token',
        tenantId: 'empresa-1',
        body: { mensagem: 'Resposta ao cliente', status: 'aguardando_cliente', updated_at: '2026-05-07 10:00:00' },
      }),
    )
  })

  it('uploads SAC response attachments before forwarding the legacy anexos contract', async () => {
    const formData = new FormData()
    const file = new File(['conteudo-pdf'], 'comprovante.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(new TextEncoder().encode('conteudo-pdf').buffer),
    })
    formData.set('action', 'respond')
    formData.set('mensagem', 'Segue comprovante')
    formData.set('status', 'aguardando_cliente')
    formData.set('updated_at', '2026-05-07 10:00:00')
    formData.append('anexos[]', file)

    const response = await runTicketAction({
      headers: new Headers({ 'content-type': 'multipart/form-data' }),
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request, { params: Promise.resolve({ id: '42' }) })

    expect(response.status).toBe(200)
    expect(putObjectCommandMock).toHaveBeenCalledWith(expect.objectContaining({
      Bucket: 'agileecommerce-files',
      ContentType: 'application/pdf',
      ACL: 'private',
    }))
    expect(putObjectCommandMock.mock.calls[0]?.[0]?.Key).toMatch(/^empresa-1\/.+\.pdf$/)
    expect(serverApiFetchMock).toHaveBeenCalledWith(
      'sac/admin/chamados/42/responder',
      expect.objectContaining({
        method: 'POST',
        token: 'session-token',
        tenantId: 'empresa-1',
        body: expect.objectContaining({
          mensagem: 'Segue comprovante',
          status: 'aguardando_cliente',
          updated_at: '2026-05-07 10:00:00',
          anexos: [
            expect.objectContaining({
              arquivo: expect.stringMatching(/\.pdf$/),
              nome_arquivo_original: 'comprovante.pdf',
              tipo_mime: 'application/pdf',
              tamanho: file.size,
            }),
          ],
        }),
      }),
    )
  })

  it('forwards SAC lookup requests without adding fixed menu assumptions', async () => {
    await listAreas()
    await listSubjects(new Request('http://localhost/api/sac/assuntos?id_sac_area=area-1'))
    await listUsers()

    expect(serverApiFetchMock).toHaveBeenNthCalledWith(1, 'sac/admin/areas', expect.objectContaining({ method: 'GET' }))
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(2, 'sac/admin/assuntos?id_sac_area=area-1', expect.objectContaining({ method: 'GET' }))
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(3, 'sac/admin/usuarios', expect.objectContaining({ method: 'GET' }))
  })

  it('forwards SAC module configuration load and save', async () => {
    await getConfig()
    await saveConfig(new Request('http://localhost/api/sac/configuracoes', {
      method: 'POST',
      body: JSON.stringify({ ativo: 1, emails_permitidos: 'sac@empresa.com', fechamento_automatico_dias: 7, prazo_reabertura_dias: 3 }),
    }))

    expect(serverApiFetchMock).toHaveBeenNthCalledWith(1, 'sac/admin/configuracoes', expect.objectContaining({ method: 'GET' }))
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(2, 'sac/admin/configuracoes', expect.objectContaining({
      method: 'POST',
      body: { ativo: 1, emails_permitidos: 'sac@empresa.com', fechamento_automatico_dias: 7, prazo_reabertura_dias: 3 },
    }))
  })

  it('forwards SAC area, subject and responsible management mutations', async () => {
    await saveArea(new Request('http://localhost/api/sac/areas', {
      method: 'POST',
      body: JSON.stringify({ id: 'area-1', nome: 'Atendimento', mostrar_nome_responsavel_cliente: 1, sla_horas: 24, ativo: 1 }),
    }))
    await deleteArea(new Request('http://localhost/api/sac/areas/area-1', { method: 'DELETE' }), { params: Promise.resolve({ id: 'area-1' }) })
    await saveSubject(new Request('http://localhost/api/sac/assuntos', {
      method: 'POST',
      body: JSON.stringify({ id: 'subject-1', id_sac_area: 'area-1', nome: 'Pedido', permite_vinculo_pedido: 1, obriga_pedido: 0, ativo: 1 }),
    }))
    await deleteSubject(new Request('http://localhost/api/sac/assuntos/subject-1', { method: 'DELETE' }), { params: Promise.resolve({ id: 'subject-1' }) })
    await listAreaResponsibles(new Request('http://localhost/api/sac/areas/area-1/responsaveis'), { params: Promise.resolve({ id: 'area-1' }) })
    await saveAreaResponsible(new Request('http://localhost/api/sac/areas/area-1/responsaveis', {
      method: 'POST',
      body: JSON.stringify({ id: 'resp-1', id_usuario: 'user-1', ativo: 1 }),
    }), { params: Promise.resolve({ id: 'area-1' }) })
    await deleteAreaResponsible(new Request('http://localhost/api/sac/areas/responsaveis/resp-1', { method: 'DELETE' }), { params: Promise.resolve({ id: 'resp-1' }) })

    expect(serverApiFetchMock).toHaveBeenNthCalledWith(1, 'sac/admin/areas', expect.objectContaining({ method: 'POST' }))
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(2, 'sac/admin/areas/area-1', expect.objectContaining({ method: 'DELETE' }))
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(3, 'sac/admin/assuntos', expect.objectContaining({ method: 'POST' }))
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(4, 'sac/admin/assuntos/subject-1', expect.objectContaining({ method: 'DELETE' }))
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(5, 'sac/admin/areas/area-1/responsaveis', expect.objectContaining({ method: 'GET' }))
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(6, 'sac/admin/areas/area-1/responsaveis', expect.objectContaining({ method: 'POST' }))
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(7, 'sac/admin/areas/responsaveis/resp-1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('rejects SAC requests without a session', async () => {
    readAuthSessionMock.mockResolvedValue(null)

    const response = await listTickets(new Request('http://localhost/api/sac/chamados'))

    expect(response.status).toBe(401)
    expect(serverApiFetchMock).not.toHaveBeenCalled()
  })
})
