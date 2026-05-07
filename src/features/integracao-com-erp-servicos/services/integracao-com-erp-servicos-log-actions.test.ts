import { describe, expect, it } from 'vitest';
import { buildExecutionLogDownloadFileName } from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-log-actions';

describe('buildExecutionLogDownloadFileName', () => {
	it('usa apenas o nome base do arquivo informado pela API', () => {
		expect(buildExecutionLogDownloadFileName({ kind: 'detail', fileName: 'C:\\logs\\execucao-18.txt' })).toBe('execucao-18.txt');
		expect(buildExecutionLogDownloadFileName({ kind: 'metadata', fileName: '../falha.json' })).toBe('falha.json');
	});

	it('usa fallback coerente quando a API nao informa arquivo', () => {
		expect(buildExecutionLogDownloadFileName({ kind: 'detail' })).toBe('servico_execucao_detalhe.txt');
		expect(buildExecutionLogDownloadFileName({ kind: 'metadata', fileName: '   ' })).toBe('servico_execucao_detalhe_metadata.txt');
	});
});
