import { render, type RenderOptions } from '@testing-library/react'
import type { PropsWithChildren, ReactElement } from 'react'
import { I18nProvider } from '@/src/i18n/context'
import type { Locale } from '@/src/i18n/types'

type ProviderOptions = {
  locale?: Locale
}

function TestProviders({
  children,
  locale = 'pt-BR',
}: PropsWithChildren<ProviderOptions>) {
  return <I18nProvider initialLocale={locale}>{children}</I18nProvider>
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & ProviderOptions,
) {
  const { locale, ...renderOptions } = options ?? {}

  return render(ui, {
    wrapper: ({ children }) => <TestProviders locale={locale}>{children}</TestProviders>,
    ...renderOptions,
  })
}
