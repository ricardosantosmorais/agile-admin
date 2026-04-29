import { serverApiFetch } from '@/src/services/http/server-api'
import type { CrudRecord } from '@/src/components/crud-base/types'

type GithubResult = {
  code: number
  body: unknown
}

type GithubConfig = {
  owner: string
  repo: string
  token: string
  branch: string
  clientsPath: string
}

export function getAppsGithubConfig(required = false): GithubConfig | null {
  const owner = (process.env.ADMIN_APPS_GITHUB_OWNER || process.env.GITHUB_OWNER || '').trim()
  const repo = (process.env.ADMIN_APPS_GITHUB_REPO || process.env.GITHUB_REPO || '').trim()
  const token = (process.env.ADMIN_APPS_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '').trim()
  const branch = (process.env.ADMIN_APPS_GITHUB_BRANCH || 'develop').trim()
  const clientsPath = (process.env.ADMIN_APPS_GITHUB_CLIENTS_PATH || 'config/clients.json').trim()

  if (!owner || !repo || !token) {
    if (required) {
      throw new Error('Configuração GitHub de Apps ausente. Defina ADMIN_APPS_GITHUB_OWNER, ADMIN_APPS_GITHUB_REPO e ADMIN_APPS_GITHUB_TOKEN.')
    }
    return null
  }

  return { owner, repo, token, branch, clientsPath }
}

export async function githubApiRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: unknown): Promise<GithubResult> {
  const config = getAppsGithubConfig(true)!
  const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'AgileEcommerce-Admin-v2',
    },
    body: data === undefined ? undefined : JSON.stringify(data),
    cache: 'no-store',
  })

  const text = await response.text()
  const body = text ? JSON.parse(text) : null
  return { code: response.status, body }
}

function recordText(record: CrudRecord, key: string) {
  return String(record[key] ?? '').trim()
}

function recordNumber(record: CrudRecord, key: string, fallback = 1) {
  const numeric = Number(record[key])
  return Number.isFinite(numeric) ? numeric : fallback
}

function buildClientsJson(apps: CrudRecord[]) {
  const result: Record<string, unknown> = {}

  for (const app of apps) {
    const key = recordText(app, 'chave_cliente')
    if (!key) continue

    result[key] = {
      app: {
        id: recordText(app, 'identificador_app'),
        name: recordText(app, 'nome_app'),
        version: recordText(app, 'versao_app'),
        buildNumber: recordNumber(app, 'build_ios'),
      },
      config: {
        companyId: recordText(app, 'id_empresa'),
        companyUrl: recordText(app, 'url_empresa'),
        logoPath: recordText(app, 's3_logo_1024_key'),
        splashPath: recordText(app, 's3_splash_logo_key'),
      },
      theme: {
        splashBackground: recordText(app, 'cor_splash_background'),
        header: recordText(app, 'cor_header'),
        button: recordText(app, 'cor_botao'),
        text: recordText(app, 'cor_texto'),
        noInternetColor: recordText(app, 'cor_sem_internet'),
      },
      texts: {
        login: {
          title: recordText(app, 'login_titulo'),
          subtitle: recordText(app, 'login_subtitulo'),
          forgotPass: recordText(app, 'login_esqueci_senha'),
          cta: recordText(app, 'login_cta'),
          signup: recordText(app, 'login_primeiro_acesso'),
        },
        forgotPassword: {
          title: recordText(app, 'fp_titulo'),
          subtitle: recordText(app, 'fp_subtitulo'),
          cta: recordText(app, 'fp_cta'),
        },
        alert: {
          title: recordText(app, 'alerta_titulo'),
          loginMessage: recordText(app, 'alerta_login_mensagem'),
          fpMessage: recordText(app, 'alerta_fp_mensagem'),
          confirm: recordText(app, 'alerta_confirmar'),
        },
        other: {
          barcodeTitle: recordText(app, 'outro_titulo_codigo_barras'),
          noInternetTitle: recordText(app, 'outro_titulo_sem_internet'),
          noInternetMessage: recordText(app, 'outro_mensagem_sem_internet'),
        },
      },
    }
  }

  return JSON.stringify(result, null, 2)
}

function isGithubSuccess(result: GithubResult) {
  return result.code >= 200 && result.code < 300
}

export async function syncAppsClientsJsonToGithub(token: string, tenantId: string) {
  const config = getAppsGithubConfig(false)
  if (!config) {
    return { skipped: true, reason: 'github-env-missing' }
  }

  const apps = await serverApiFetch('apps?perpage=1000&ativo=1', {
    method: 'GET',
    token,
    tenantId,
  })

  if (!apps.ok) {
    throw new Error('Não foi possível carregar apps ativos para sincronizar o clients.json.')
  }

  const payload = apps.payload as { data?: CrudRecord[] }
  const content = buildClientsJson(Array.isArray(payload.data) ? payload.data : [])
  const currentFile = await githubApiRequest(`/contents/${config.clientsPath}?ref=${encodeURIComponent(config.branch)}`)
  const currentBody = typeof currentFile.body === 'object' && currentFile.body !== null ? currentFile.body as { sha?: string } : {}

  const result = await githubApiRequest(`/contents/${config.clientsPath}`, 'PUT', {
    message: 'Auto-update clients.json via Admin v2',
    content: Buffer.from(content).toString('base64'),
    branch: config.branch,
    ...(currentBody.sha ? { sha: currentBody.sha } : {}),
  })

  if (!isGithubSuccess(result)) {
    throw new Error('GitHub recusou a atualização do clients.json.')
  }

  return { skipped: false, result }
}

export async function triggerGithubRepositoryDispatch(eventType: string, clientPayload: Record<string, unknown>) {
  const config = getAppsGithubConfig(true)!
  const result = await githubApiRequest('/dispatches', 'POST', {
    event_type: eventType,
    client_payload: {
      ...clientPayload,
      branch: String(clientPayload.branch || config.branch),
    },
  })

  if (!isGithubSuccess(result)) {
    throw new Error('GitHub recusou o dispatch do workflow.')
  }

  return result
}

export async function triggerGithubWorkflowDispatch(workflowFilename: string, inputs: Record<string, unknown>) {
  const config = getAppsGithubConfig(true)!
  const result = await githubApiRequest(`/actions/workflows/${workflowFilename}/dispatches`, 'POST', {
    ref: config.branch,
    inputs: {
      ...inputs,
      branch: String(inputs.branch || config.branch),
    },
  })

  if (!isGithubSuccess(result)) {
    throw new Error('GitHub recusou o workflow dispatch.')
  }

  return result
}
