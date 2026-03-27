export function isTruthyFlag(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export function toBooleanChoiceValue(value: unknown) {
  if (value === true || value === 1 || value === '1' || value === 'S') {
    return '1'
  }

  if (value === false || value === 0 || value === '0' || value === 'N') {
    return '0'
  }

  return ''
}
