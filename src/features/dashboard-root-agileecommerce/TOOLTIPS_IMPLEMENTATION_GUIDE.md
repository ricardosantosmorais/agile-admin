/\*\*

- Guia de Implementação de Tooltips no Dashboard
-
- Este arquivo explica como integrar os tooltips e explicações
- no componente React do dashboard usando o Shadcn/UI Tooltip.
  \*/

// ============ EXEMPLO 1: Tooltip em Card Executivo ============

import { Tooltip, TooltipContent, TooltipTrigger } from '@/src/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { dashboardTooltips } from '@/src/features/dashboard-root-agileecommerce/constants/dashboard-tooltips'

// ANTES (sem tooltip):
function ExecutiveCard({ label, value, variation }) {
return (
<div className="rounded-2xl border bg-white p-4">
<div className="text-sm font-medium text-slate-600">{label}</div>
<div className="mt-2 text-3xl font-bold">{value}</div>
{variation !== undefined && <div className="mt-1 text-xs text-green-600">↑ {variation}</div>}
</div>
)
}

// DEPOIS (com tooltip):
function ExecutiveCardComTooltip({ label, value, variation, tooltipKey }) {
const tooltip = dashboardTooltips.resumo[tooltipKey]

if (!tooltip) {
// Fallback se não achar tooltip
return <ExecutiveCard label={label} value={value} variation={variation} />
}

return (
<Tooltip>
<TooltipTrigger asChild>
<div className="cursor-help rounded-2xl border bg-white p-4">
<div className="flex items-center justify-between">
<div className="text-sm font-medium text-slate-600">{label}</div>
<HelpCircle className="h-4 w-4 text-slate-400" />
</div>
<div className="mt-2 text-3xl font-bold">{value}</div>
{variation !== undefined && <div className="mt-1 text-xs text-green-600">↑ {variation}</div>}
</div>
</TooltipTrigger>
<TooltipContent side="right" className="max-w-xs">
<div className="space-y-2">
<p className="font-semibold">{tooltip.titulo}</p>
<p className="text-xs text-slate-300">{tooltip.descricao}</p>
{tooltip.fonte && <p className="text-xs font-mono text-blue-300">{tooltip.fonte}</p>}
{tooltip.formula && <p className="text-xs text-yellow-300">Fórmula: {tooltip.formula}</p>}
{tooltip.periodo && <p className="text-xs text-purple-300">Período: {tooltip.periodo}</p>}
</div>
</TooltipContent>
</Tooltip>
)
}

// USO:
function DashboardResumoCom Tooltips({ snapshot }) {
return (
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
<ExecutiveCardComTooltip
label={t('dashboardRoot.cards.activeCompanies', 'Empresas ativas')}
value={snapshot.resumo?.carteira.empresas_ativas}
tooltipKey="empresasAtivasCard"
/>
<ExecutiveCardComTooltip
label={t('dashboardRoot.cards.productionCompanies', 'Empresas em produção')}
value={snapshot.resumo?.carteira.empresas_producao}
tooltipKey="empresasProducaoCard"
/>
{/_ ... mais cards ... _/}
</div>
)
}

// ============ EXEMPLO 2: Tooltip em Coluna de Tabela ============

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/components/ui/table'

function SimpleTableComTooltips({ rows, columns }) {
return (
<Table>
<TableHeader>
<TableRow>
{columns.map((col) => {
const tooltip = dashboardTooltips.geral.formatacao[col.tooltipKey]

            return (
              <TableHead key={col.key}>
                <div className="flex items-center gap-2">
                  {col.label}
                  {tooltip && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 cursor-help text-slate-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, idx) => (
          <TableRow key={idx}>
            {columns.map((col) => (
              <TableCell key={col.key}>{col.formatter ? col.formatter(row[col.key]) : row[col.key]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>

)
}

// ============ EXEMPLO 3: Expandible Info Section ============

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

function SectionComExplicacao({ title, description, tooltipKey, children }) {
const [expanded, setExpanded] = useState(false)
const tooltip = dashboardTooltips.ia[tooltipKey]

return (
<div className="rounded-lg border bg-white">
<div className="flex items-start justify-between border-b p-4">
<div className="flex-1">
<h3 className="font-semibold text-slate-900">{title}</h3>
<p className="text-sm text-slate-600">{description}</p>
</div>

        {tooltip && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-4 text-slate-400 hover:text-slate-600"
          >
            <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {expanded && tooltip && (
        <div className="border-t bg-blue-50 p-4">
          <div className="space-y-3 text-sm">
            {tooltip.descricao && (
              <div>
                <p className="font-semibold text-slate-700">O que é?</p>
                <p className="text-slate-600">{tooltip.descricao}</p>
              </div>
            )}

            {tooltip.fonte && (
              <div>
                <p className="font-semibold text-slate-700">Fonte de dados:</p>
                <code className="block rounded bg-slate-100 p-2 text-xs text-slate-700">{tooltip.fonte}</code>
              </div>
            )}

            {tooltip.formula && (
              <div>
                <p className="font-semibold text-slate-700">Cálculo:</p>
                <code className="block rounded bg-slate-100 p-2 text-xs text-slate-700">{tooltip.formula}</code>
              </div>
            )}

            {tooltip.como_usar && (
              <div>
                <p className="font-semibold text-slate-700">Como usar:</p>
                <ol className="list-inside list-decimal space-y-1 text-slate-600">
                  {tooltip.como_usar.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {tooltip.exemplo && (
              <div>
                <p className="font-semibold text-slate-700">Exemplo:</p>
                <pre className="overflow-auto rounded bg-slate-100 p-2 text-xs text-slate-700">
                  {Array.isArray(tooltip.exemplo) ? tooltip.exemplo.join('\n') : tooltip.exemplo}
                </pre>
              </div>
            )}

            {tooltip.alerta && (
              <div className="rounded border-l-4 border-yellow-400 bg-yellow-50 p-2">
                <p className="text-xs font-semibold text-yellow-700">⚠️ {tooltip.alerta}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-4">{children}</div>
    </div>

)
}

// USO:
function OperacaoSection({ snapshot }) {
return (
<div className="space-y-4">
<SectionComExplicacao
title={t('dashboardRoot.tables.processAlerts', 'Alertas de processos falhos recentes')}
description={t(
'dashboardRoot.processAlertsDescription',
'Concentre aqui as últimas falhas operacionais para triagem rápida.',
)}
tooltipKey="alertasProcessos" >
<SimpleTable rows={snapshot.processos?.alertas_falha_recente ?? []} />
</SectionComExplicacao>
</div>
)
}

// ============ EXEMPLO 4: Legend com Tooltips ============

function LegendComExplicacoes() {
return (
<div className="space-y-2 rounded-lg bg-slate-50 p-4">
<div className="font-semibold text-slate-700">Como ler os alertas:</div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-3 w-3 rounded-full bg-red-500" />
          <div>
            <p className="font-semibold text-slate-700">Crítico (taxa erro &gt; 10%)</p>
            <p className="text-xs text-slate-600">Investigar imediatamente. Pode ser servidor down, bug ou serviço indisponível.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 h-3 w-3 rounded-full bg-yellow-500" />
          <div>
            <p className="font-semibold text-slate-700">Atenção (taxa erro 5-10%)</p>
            <p className="text-xs text-slate-600">Observar. Não é crítico mas fique atento a mudanças.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 h-3 w-3 rounded-full bg-green-500" />
          <div>
            <p className="font-semibold text-slate-700">Ok (taxa erro &lt; 5%)</p>
            <p className="text-xs text-slate-600">Continuar monitorando normalmente.</p>
          </div>
        </div>
      </div>
    </div>

)
}

// ============ EXEMPLO 5: Info Box Detalhada (para modais) ============

function InfoBoxDetalhada({ tooltipKey, nested = false }) {
const tooltip = nested ? dashboardTooltips[nested][tooltipKey] : dashboardTooltips.geral[tooltipKey]

if (!tooltip) return null

return (
<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
<h4 className="font-semibold text-blue-900">{tooltip.titulo}</h4>

      <div className="mt-3 space-y-2 text-sm text-blue-800">
        {tooltip.descricao && <p>{tooltip.descricao}</p>}

        {tooltip.fonte && (
          <>
            <p className="mt-2 font-semibold">SQL:</p>
            <code className="block rounded bg-white p-2 font-mono text-xs text-slate-700">{tooltip.fonte}</code>
          </>
        )}

        {tooltip.periodo && <p className="text-xs italic">⏱️ Período: {tooltip.periodo}</p>}

        {tooltip.valores && (
          <>
            <p className="mt-2 font-semibold">Valores possíveis:</p>
            <ul className="list-inside list-disc space-y-1 pl-2 text-xs">
              {tooltip.valores.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>

)
}

// ============ SETUP: TooltipProvider ============

// No layout.tsx do dashboard:
import { TooltipProvider } from '@/src/components/ui/tooltip'

export function DashboardLayout({ children }) {
return (
<TooltipProvider>
<div>{children}</div>
</TooltipProvider>
)
}

// ============ CHECKLIST DE IMPLEMENTAÇÃO ============

/\*\*

- Ao implementar tooltips no dashboard, verificar:
-
- ✅ Instalar/verificar @radix-ui/react-tooltip
- ✅ Criar wrapper TooltipProvider no layout
- ✅ Adicionar ícone "?" ou "ℹ️" perto de cada métrica importante
- ✅ Hover mostrar título + descrição
- ✅ Click em "expandir" mostrar detalhes completos (SQL, fórmula, exemplo)
- ✅ Testar em mobile (tooltip não deve cobrir controles)
- ✅ Testar em light e dark mode
- ✅ Adicionar loading state se dados são dinâmicos
- ✅ Considerar i18n para tooltips (se multi-idioma)
- ✅ Validar que tooltips não quebram layout
- ✅ Adicionar no roadmap: Print cheat sheet com todas as explicações
  \*/

// ============ EXEMPLO COMPLETO: Card com tudo ============

function ExecutiveCardFull({ label, value, variation, descricao, fonte, formula, alerta }) {
const [showDetails, setShowDetails] = useState(false)

return (
<div className="rounded-2xl border bg-white p-4 transition-all hover:shadow-lg">
<div className="flex items-start justify-between">
<div>
<div className="text-sm font-medium text-slate-600">{label}</div>
<div className="mt-2 text-3xl font-bold">{value}</div>
{variation !== undefined && (
<div className={`mt-1 text-xs ${variation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
{variation >= 0 ? '↑' : '↓'} {Math.abs(variation)}%
</div>
)}
</div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => setShowDetails(!showDetails)} className="text-slate-400 hover:text-slate-600">
              <HelpCircle className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="w-80">
            <div className="space-y-2 text-sm">
              <p className="font-semibold">{label}</p>
              <p className="text-xs text-slate-300">{descricao}</p>
              {fonte && <p className="font-mono text-xs text-blue-300">Fonte: {fonte}</p>}
              {formula && <p className="font-mono text-xs text-yellow-300">Fórmula: {formula}</p>}
              {alerta && <p className="text-xs text-orange-300">⚠️ {alerta}</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      {showDetails && (
        <div className="mt-4 border-t pt-3">
          <div className="space-y-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
            <p>
              <strong>O que é:</strong> {descricao}
            </p>
            {fonte && (
              <p>
                <strong>Fonte:</strong> {fonte}
              </p>
            )}
            {formula && (
              <p>
                <strong>Cálculo:</strong> {formula}
              </p>
            )}
            {alerta && (
              <p className="rounded bg-yellow-100 p-2">
                <strong>⚠️ Alerta:</strong> {alerta}
              </p>
            )}
          </div>
        </div>
      )}
    </div>

)
}
