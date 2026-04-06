export type ConfiguracoesTimeOption = {
  value: string
  label: string
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function buildLabel(hour: number, minutes: number) {
  return `${pad(hour)}:${pad(minutes)}`
}

export const configuracoesTimeOptionsFrom: ConfiguracoesTimeOption[] = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
  const minutes = index % 2 === 0 ? 0 : 30

  return {
    value: `${pad(hour)}${pad(minutes)}00`,
    label: buildLabel(hour, minutes),
  }
})

export const configuracoesTimeOptionsTo: ConfiguracoesTimeOption[] = [
  { value: '235959', label: '00:00' },
  ...Array.from({ length: 47 }, (_, index) => {
    const nextIndex = index + 1
    const hour = Math.floor(nextIndex / 2)
    const minutes = nextIndex % 2 === 0 ? 0 : 30

    return {
      value: `${pad(hour)}${pad(minutes)}59`,
      label: buildLabel(hour, minutes),
    }
  }),
  { value: '233059', label: '23:30' },
]
