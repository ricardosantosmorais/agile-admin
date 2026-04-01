import { redirect } from 'next/navigation'
import { readAuthSession } from '@/src/features/auth/services/auth-session'

export default async function HomePage() {
  const session = await readAuthSession()

  redirect(session ? '/dashboard' : '/login')
}
