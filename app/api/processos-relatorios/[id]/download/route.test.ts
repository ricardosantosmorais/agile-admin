import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/processos-relatorios/[id]/download/route'

const {
  readAuthSessionMock,
  s3SendMock,
  serverApiFetchMock,
} = vi.hoisted(() => ({
  readAuthSessionMock: vi.fn(),
  s3SendMock: vi.fn(),
  serverApiFetchMock: vi.fn(),
}))

vi.mock('@/src/features/auth/services/auth-session', () => ({
  readAuthSession: readAuthSessionMock,
}))

vi.mock('@/src/services/http/server-api', () => ({
  serverApiFetch: serverApiFetchMock,
}))

vi.mock('@aws-sdk/client-s3', () => ({
  GetObjectCommand: vi.fn((input) => ({ input })),
  S3Client: vi.fn(() => ({
    send: s3SendMock,
  })),
}))

function createDownloadBody(content: string) {
  return {
    transformToWebStream() {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(content))
          controller.close()
        },
      })
    },
  }
}

describe('processos-relatorios download route', () => {
  beforeEach(() => {
    readAuthSessionMock.mockReset()
    s3SendMock.mockReset()
    serverApiFetchMock.mockReset()

    vi.stubEnv('UPLOAD_S3_ACCESS_KEY_ID', 'access-key')
    vi.stubEnv('UPLOAD_S3_SECRET_ACCESS_KEY', 'secret-key')
    vi.stubEnv('UPLOAD_S3_PRIVATE_BUCKET', 'private-bucket')

    readAuthSessionMock.mockResolvedValue({
      token: 'session-token',
      currentTenantId: 'tenant-tab-2',
      currentUserId: 'user-1',
    })
  })

  it('blocks downloads when the process does not belong to the active tab tenant', async () => {
    serverApiFetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      payload: {
        data: [{ id: 'process-1', id_empresa: 'tenant-tab-1', arquivo: 'relatorios/process-1.xlsx' }],
      },
    })

    const response = await GET(new Request('http://localhost/api/processos-relatorios/process-1/download'), {
      params: Promise.resolve({ id: 'process-1' }),
    })

    expect(response.status).toBe(403)
    expect(s3SendMock).not.toHaveBeenCalled()
  })

  it('returns an attachment for the process file in the active tab tenant', async () => {
    serverApiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: {
          data: [{ id: 'process-1', id_empresa: 'tenant-tab-2', id_relatorio: 'report-1', arquivo: 'relatorios/process-1.xlsx' }],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        payload: {
          data: [{ id: 'report-1', nome: 'Relatório de Vendas' }],
        },
      })

    s3SendMock.mockResolvedValueOnce({
      Body: createDownloadBody('arquivo'),
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ContentLength: 7,
    })

    const response = await GET(new Request('http://localhost/api/processos-relatorios/process-1/download'), {
      params: Promise.resolve({ id: 'process-1' }),
    })

    expect(response.status).toBe(200)
    expect(serverApiFetchMock).toHaveBeenNthCalledWith(
      1,
      'processos?id=process-1',
      expect.objectContaining({
        token: 'session-token',
        tenantId: 'tenant-tab-2',
      }),
    )
    expect(s3SendMock).toHaveBeenCalledWith(expect.objectContaining({
      input: {
        Bucket: 'private-bucket',
        Key: 'relatorios/process-1.xlsx',
      },
    }))
    expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="Relatorio de Vendas.xlsx"; filename*=UTF-8\'\'Relat%C3%B3rio%20de%20Vendas.xlsx')
    await expect(response.text()).resolves.toBe('arquivo')
  })
})
