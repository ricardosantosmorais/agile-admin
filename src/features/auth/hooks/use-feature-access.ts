'use client'

import { useMemo } from 'react'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { getFeatureAccess, getFeatureLabel, type FeatureKey } from '@/src/features/auth/services/permissions'

export function useFeatureAccess(featureKey: FeatureKey) {
  const { session } = useAuth()

  return useMemo(() => ({
    featureLabel: getFeatureLabel(featureKey),
    ...getFeatureAccess(session, featureKey),
  }), [featureKey, session])
}
