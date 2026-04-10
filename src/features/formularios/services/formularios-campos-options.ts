export type FormularioCampoSelectorOption = {
  titulo: string
  valor: string
}

function toString(value: unknown) {
  return String(value ?? '').trim()
}

export function parseFormularioCampoSelectorOptions(json: string | null | undefined): FormularioCampoSelectorOption[] {
  if (!json || !json.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((item) => typeof item === 'object' && item !== null)
      .map((item) => ({
        titulo: toString((item as { titulo?: unknown }).titulo),
        valor: toString((item as { valor?: unknown }).valor),
      }))
      .filter((item) => item.titulo.length > 0 || item.valor.length > 0)
  } catch {
    return []
  }
}

export function stringifyFormularioCampoSelectorOptions(options: FormularioCampoSelectorOption[]) {
  const normalized = options
    .map((option) => ({
      titulo: toString(option.titulo),
      valor: toString(option.valor),
    }))
    .filter((option) => option.titulo.length > 0 || option.valor.length > 0)

  if (!normalized.length) {
    return null
  }

  return JSON.stringify(normalized)
}
