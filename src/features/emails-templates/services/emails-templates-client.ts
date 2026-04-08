'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'

export const emailsTemplatesClient = createCrudClient('/api/emails-templates')
