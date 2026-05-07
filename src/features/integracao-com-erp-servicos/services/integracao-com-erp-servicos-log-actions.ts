type ExecutionLogDownloadInput = {
	kind: 'detail' | 'metadata';
	fileName?: string;
};

const DEFAULT_DETAIL_FILE_NAME = 'servico_execucao_detalhe.txt';
const DEFAULT_METADATA_FILE_NAME = 'servico_execucao_detalhe_metadata.txt';

export function buildExecutionLogDownloadFileName(input: ExecutionLogDownloadInput): string {
	const fallback = input.kind === 'metadata' ? DEFAULT_METADATA_FILE_NAME : DEFAULT_DETAIL_FILE_NAME;
	const rawFileName = String(input.fileName || '').trim();
	if (!rawFileName) {
		return fallback;
	}

	const baseName = rawFileName.split(/[\\/]+/).pop()?.trim();
	return baseName || fallback;
}
