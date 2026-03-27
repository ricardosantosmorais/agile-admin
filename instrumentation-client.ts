import * as Sentry from '@sentry/nextjs'
import { getSentryClientConfig } from '@/src/lib/sentry'

Sentry.init(getSentryClientConfig())

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
