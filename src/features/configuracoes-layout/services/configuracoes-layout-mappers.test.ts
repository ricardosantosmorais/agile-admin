import { describe, expect, it } from 'vitest'
import {
  getDirtyConfiguracoesLayoutKeys,
  normalizeConfiguracoesLayoutRecord,
} from '@/src/features/configuracoes-layout/services/configuracoes-layout-mappers'

describe('configuracoes-layout-mappers', () => {
  it('normaliza os parÃ¢metros do layout com fallback de logo e Ã­cone da empresa', () => {
    const record = normalizeConfiguracoesLayoutRecord({
      parameters: {
        data: [
          {
            chave: 'css',
            parametros: '.hero { color: red; }',
            created_at: '2026-04-02 09:00:00',
            usuario: { nome: 'Ricardo' },
          },
          {
            chave: 'barra-topo',
            parametros: '<header>Topo</header>',
          },
        ],
      },
      company: {
        data: [
          {
            id: '1698203521854804',
            logo: 'https://cescom.agilecdn.com.br/imgs/logo.png',
            logo_alt: 'https://cescom.agilecdn.com.br/imgs/logo.png',
            ico: 'https://cescom.agilecdn.com.br/imgs/ico.png',
            s3_bucket: 'https://cescom.agilecdn.com.br',
          },
        ],
      },
    })

    expect(record.values.css).toBe('.hero { color: red; }')
    expect(record.values['barra-topo']).toBe('<header>Topo</header>')
    expect(record.values.logomarca).toBe('https://cescom.agilecdn.com.br/imgs/logo.png')
    expect(record.values.ico).toBe('https://cescom.agilecdn.com.br/imgs/ico.png')
    expect(record.metadata.css).toEqual({
      updatedAt: '2026-04-02 09:00:00',
      updatedBy: 'Ricardo',
    })
    expect(record.company.bucketUrl).toBe('https://cescom.agilecdn.com.br')
  })

  it('detecta apenas os campos alterados', () => {
    const dirtyKeys = getDirtyConfiguracoesLayoutKeys(
      {
        logomarca: '',
        ico: '',
        css: '.hero {}',
        'barra-topo': '<header>A</header>',
        'barra-topo-mobile': '',
        'barra-menu': '',
        'barra-menu-mobile': '',
        'barra-newsletter': '',
        'barra-servicos': '',
        'barra-rodape': '',
        meta_titulo: 'TÃ­tulo antigo',
        meta_palavras_chave: '',
        meta_descricao: '',
      },
      {
        logomarca: 'https://cdn/logo.png',
        ico: '',
        css: '.hero {}',
        'barra-topo': '<header>A</header>',
        'barra-topo-mobile': '',
        'barra-menu': '<nav>Menu</nav>',
        'barra-menu-mobile': '',
        'barra-newsletter': '',
        'barra-servicos': '',
        'barra-rodape': '',
        meta_titulo: 'TÃ­tulo novo',
        meta_palavras_chave: '',
        meta_descricao: '',
      },
    )

    expect(dirtyKeys).toEqual(['logomarca', 'barra-menu', 'meta_titulo'])
  })
})


