import { NextResponse } from 'next/server'
import { asArray, asRecord, extractApiErrorMessage, resolveConsultasContext, serverTenantFetch, toStringValue } from '@/app/api/consultas/_shared'
import { buildEnvioArquivoUrl } from '@/src/features/consultas-envios-formularios/services/envios-formularios-files'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	const contextResult = await resolveConsultasContext()
	if ('error' in contextResult) {
		return contextResult.error
	}

	const { context } = contextResult
	const { id } = await params
	const result = await serverTenantFetch(context, `formularios_envios?id=${encodeURIComponent(id)}&embed=dados,formulario,cliente`)

	if (!result.ok) {
		return NextResponse.json(
			{ message: extractApiErrorMessage(result.payload, 'Não foi possível carregar os detalhes do envio.') },
			{ status: result.status || 400 },
		)
	}

	const payload = asRecord(result.payload)
	const envio = asRecord(asArray(payload.data)[0])
	if (!Object.keys(envio).length) {
		return NextResponse.json({ message: 'Envio não encontrado.' }, { status: 404 })
	}

	return NextResponse.json({
		data: {
			id: toStringValue(envio.id),
			formularioTitulo: toStringValue(asRecord(envio.formulario).titulo),
			data: toStringValue(envio.data),
			clienteNome: toStringValue(asRecord(envio.cliente).nome_fantasia || asRecord(envio.cliente).razao_social),
			clienteDocumento: toStringValue(asRecord(envio.cliente).cnpj_cpf),
			campos: asArray(envio.dados)
				.map((entry) => {
					const dado = asRecord(entry)
					const campo = asRecord(dado.campo)
					const tipo = toStringValue(campo.tipo)
					const valor = toStringValue(dado.valor)
					return {
						id: toStringValue(dado.id || campo.id || campo.nome),
						titulo: toStringValue(campo.titulo || campo.nome || dado.id),
						tipo,
						valor,
						arquivoUrl: tipo === 'arquivo' && valor ? buildEnvioArquivoUrl(valor, process.env.ADMIN_URL_APP, process.env.ADMIN_URL_API_PAINELB2B) : '',
					}
				})
				.filter((entry) => entry.titulo),
		},
	})
}
