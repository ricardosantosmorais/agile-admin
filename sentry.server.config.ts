import * as Sentry from '@sentry/nextjs'
import { getSentryServerConfig } from '@/src/lib/sentry'

Sentry.init(getSentryServerConfig())
