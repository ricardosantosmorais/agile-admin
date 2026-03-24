import { NotificationDetailPage } from '@/src/features/notifications/components/notification-detail-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function NotificationRoutePage() {
  return (
    <ParamsBridge>
      <NotificationDetailPage />
    </ParamsBridge>
  )
}
