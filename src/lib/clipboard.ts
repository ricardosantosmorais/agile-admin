export async function copyTextToClipboard(value: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    throw new Error('Clipboard não disponível neste navegador.')
  }

  await navigator.clipboard.writeText(value)
}
