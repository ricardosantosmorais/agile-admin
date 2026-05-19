import { normalizeCatalogoDigitalDetail } from '@/src/features/catalogos-digitais/services/catalogos-digitais-mappers'

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function normalizeSectionType(section: Record<string, unknown>) {
  const type = String(section.tipo || 'texto')
  const model = String(section.modelo_secao || '')
  if (type === 'capa') return 'banner'
  if (type === 'fechamento') return 'cta'
  if (type === 'produtos') return ['products_list', 'products_list_compact'].includes(model) ? 'produtos_lista' : 'produtos_grid'
  return ['banner', 'titulo', 'produtos_grid', 'produtos_lista', 'texto', 'cta', 'divisor', 'espacador', 'quebra_pagina'].includes(type) ? type : 'texto'
}

function sanitizeRichHtml(value: unknown) {
  return String(value ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"')
}

function sanitizeCustomCss(value: unknown) {
  const css = String(value ?? '')
    .replace(/\0/g, '')
    .replace(/<\s*\/\s*style/gi, '<\\/style')
    .replace(/<\s*\/\s*script/gi, '<\\/script')
    .trim()
  return css.length > 30000 ? css.slice(0, 30000) : css
}

function productPrice(product: Record<string, unknown>) {
  const snapshot = asRecord(product.preco_snapshot)
  const value = snapshot.preco_venda ?? product.preco_valor ?? product.preco
  const number = Number(String(value ?? '').replace(',', '.'))
  if (!Number.isFinite(number) || number <= 0) return ''
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
}

function productCard(product: Record<string, unknown>, showPrice: boolean) {
  const image = String(product.imagem || product.image || '').trim()
  const price = showPrice ? productPrice(product) : ''
  return [
    '<article class="catalog-card">',
    image ? `<div class="catalog-card-image"><img src="${escapeHtml(image)}" alt=""></div>` : '<div class="catalog-card-image catalog-card-image-empty"></div>',
    '<div class="catalog-card-body">',
    `<div class="catalog-card-code">Código ${escapeHtml(product.codigo || product.code || product.id || '')}</div>`,
    `<h3>${escapeHtml(product.nome || product.name || 'Produto')}</h3>`,
    product.descricao ? `<p>${escapeHtml(product.descricao)}</p>` : '',
    product.marca ? `<p><strong>Marca:</strong> ${escapeHtml(product.marca)}</p>` : '',
    price ? `<strong class="catalog-card-price">${escapeHtml(price)}</strong>` : '',
    '</div>',
    '</article>',
  ].join('')
}

function sectionStyle(section: Record<string, unknown>) {
  const background = String(section.background || '#ffffff')
  const color = String(section.text_color || '#0f172a')
  const accent = String(section.accent || '#40b2ae')
  const padding = Math.max(0, Math.min(80, Number(section.padding_y ?? 16) || 16))
  return `background:${escapeHtml(background)};color:${escapeHtml(color)};--catalog-accent:${escapeHtml(accent)};padding:${padding}mm 16mm;`
}

function renderSection(section: Record<string, unknown>, index: number, productMap: Map<string, Record<string, unknown>>, showCatalogPrice: boolean) {
  const type = normalizeSectionType(section)
  if (type === 'quebra_pagina') return '<div class="catalog-page-break"></div>'
  if (type === 'espacador') return `<section class="catalog-block catalog-spacer" style="${sectionStyle(section)}"></section>`
  if (type === 'divisor') return `<section class="catalog-block catalog-divider" style="${sectionStyle(section)}"><span></span></section>`

  const title = escapeHtml(section.titulo)
  const subtitle = escapeHtml(section.subtitulo)
  const number = String(index + 1).padStart(2, '0')
  const banner = String(section.banner_url || '').trim()
  const header = title || subtitle
    ? `<header><span>${number}</span><div>${title ? `<h2>${title}</h2>` : ''}${subtitle ? `<p>${subtitle}</p>` : ''}</div></header>`
    : ''

  const customHtml = sanitizeRichHtml(section.html_customizado || section.custom_html)
  if (customHtml) {
    return `<section class="catalog-block catalog-custom" style="${sectionStyle(section)}">${customHtml}</section>`
  }

  if (type === 'banner') {
    return [
      `<section class="catalog-block catalog-banner" style="${sectionStyle(section)}">`,
      banner ? `<figure><img src="${escapeHtml(banner)}" alt=""></figure>` : '',
      `<div class="catalog-banner-copy">${title ? `<h1>${title}</h1>` : ''}${subtitle ? `<p>${subtitle}</p>` : ''}</div>`,
      '</section>',
    ].join('')
  }

  if (type === 'titulo') {
    return `<section class="catalog-block catalog-title" style="${sectionStyle(section)}">${header}</section>`
  }

  if (type === 'produtos_grid' || type === 'produtos_lista') {
    const sectionShowPrice = showCatalogPrice && section.mostrar_preco !== false
    const cards = asArray(section.produtos)
      .map((id) => productMap.get(String(id)))
      .filter((product): product is Record<string, unknown> => Boolean(product))
      .map((product) => productCard(product, sectionShowPrice))
      .join('')
    if (!cards) return ''
    return `<section class="catalog-block catalog-products ${type === 'produtos_lista' ? 'catalog-products-list' : ''}" style="${sectionStyle(section)}">${header}<div class="catalog-grid">${cards}</div></section>`
  }

  return `<section class="catalog-block catalog-rich" style="${sectionStyle(section)}">${banner ? `<figure class="catalog-rich-banner"><img src="${escapeHtml(banner)}" alt=""></figure>` : ''}${header}<div class="catalog-rich-html">${sanitizeRichHtml(section.texto_html)}</div></section>`
}

export function renderCatalogoDigitalPreviewHtml(response: unknown) {
  const detail = normalizeCatalogoDigitalDetail(response)
  const snapshot = asRecord(detail.snapshot)
  const products = asArray(detail.products.length ? detail.products : snapshot.produtos).map(asRecord)
  const sections = asArray(detail.sections.length ? detail.sections : snapshot.secoes).map(asRecord)
  const productMap = new Map<string, Record<string, unknown>>()
  for (const product of products) {
    for (const key of [product.id, product.codigo, product.code]) {
      if (key !== undefined && key !== null && String(key).trim()) productMap.set(String(key), product)
    }
  }
  const customCss = sanitizeCustomCss(snapshot.custom_css || snapshot.css_customizado)
  const blocks = sections.map((section, index) => renderSection(section, index, productMap, detail.showPrice)).join('')
  const empty = '<section class="catalog-block catalog-title"><h2>Adicione blocos para montar o catálogo.</h2></section>'

  return `<!doctype html>
<html lang="pt-BR" class="catalog-view catalog-view-web">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(detail.name || 'Prévia do catálogo')}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#eef2f7;color:#0f172a;font-family:Arial,Helvetica,sans-serif}.catalog-document{width:min(210mm,100%);min-height:297mm;margin:0 auto;background:#fff;box-shadow:0 18px 48px rgba(15,23,42,.18);overflow:hidden}.catalog-block{break-inside:avoid;page-break-inside:avoid}.catalog-block header{display:flex;align-items:flex-end;gap:7mm;margin-bottom:8mm;border-bottom:1px solid #d9e1ea;padding-bottom:5mm}.catalog-block header span,.catalog-card-code{color:var(--catalog-accent,#40b2ae);font-weight:900}.catalog-block h1,.catalog-block h2{margin:0;color:inherit;line-height:1.08}.catalog-block h1{font-size:38px}.catalog-block h2{font-size:26px}.catalog-block p{line-height:1.45}.catalog-banner{position:relative;min-height:96mm;display:flex;align-items:flex-end;overflow:hidden}.catalog-banner figure{position:absolute;inset:0;margin:0}.catalog-banner img{width:100%;height:100%;object-fit:cover;opacity:.72}.catalog-banner-copy{position:relative;max-width:132mm;padding:10mm;border-radius:4mm;background:rgba(15,23,42,.38);color:#fff}.catalog-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5mm}.catalog-products-list .catalog-grid{grid-template-columns:1fr}.catalog-card{border:1px solid #e5e7eb;border-radius:3mm;overflow:hidden;background:#fff;color:#111827}.catalog-card-image{height:42mm;display:flex;align-items:center;justify-content:center;background:#f8fafc;border-bottom:1px solid #e5e7eb}.catalog-card-image img{max-width:100%;max-height:38mm;object-fit:contain;padding:3mm}.catalog-card-image-empty:before{content:"";width:20mm;height:20mm;border-radius:50%;background:#e5e7eb}.catalog-card-body{padding:5mm}.catalog-card-body h3{margin:2mm 0 0;font-size:14px;line-height:1.25}.catalog-card-body p{margin:3mm 0 0;color:#64748b;font-size:11px}.catalog-card-price{display:block;margin-top:4mm;padding-top:4mm;border-top:1px solid #e5e7eb;color:var(--catalog-accent,#0f172a)}.catalog-divider span{display:block;height:2px;background:var(--catalog-accent,#40b2ae)}.catalog-spacer{min-height:18mm}.catalog-rich-html{font-size:14px;line-height:1.6}.catalog-page-break{break-after:page;page-break-after:always;height:0}@media(max-width:760px){body{background:#fff}.catalog-document{width:100%;min-height:0;box-shadow:none}.catalog-block{padding:24px 20px!important}.catalog-block header{align-items:flex-start;flex-direction:column;gap:8px}.catalog-grid{grid-template-columns:1fr}.catalog-banner{min-height:360px}.catalog-banner-copy{max-width:100%;padding:24px;border-radius:16px}}
</style>
${customCss ? `<style id="catalog-custom-css">\n${customCss}\n</style>` : ''}
</head>
<body>
<main class="catalog-document catalog-document-web">
${blocks || empty}
</main>
</body>
</html>`
}
