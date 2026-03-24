export type UploadAssetResult = {
  value: string
  previewValue?: string
}

export type UploadAssetHandler = (file: File) => Promise<UploadAssetResult | string>

export function fileToDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Nao foi possivel converter o arquivo.'))
    reader.readAsDataURL(file)
  })
}

export async function base64UploadHandler(file: File): Promise<UploadAssetResult> {
  const dataUrl = await fileToDataUrl(file)
  return {
    value: dataUrl,
    previewValue: dataUrl,
  }
}

export function normalizeUploadResult(result: UploadAssetResult | string): UploadAssetResult {
  if (typeof result === 'string') {
    return { value: result, previewValue: result }
  }

  return {
    value: result.value,
    previewValue: result.previewValue ?? result.value,
  }
}
