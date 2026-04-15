'use client';

import { DashboardPage } from '@/src/features/dashboard/components/dashboard-page';
import { useTenant } from '@/src/contexts/tenant-context';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { DashboardRootAgileecommercePage } from '@/src/features/dashboard-root-agileecommerce/components/dashboard-root-agileecommerce-page';

export function DashboardRouteSwitcher() {
	const { currentTenant } = useTenant();
	const { session } = useAuth();
	const isRootDashboard = currentTenant.id === 'agileecommerce' && session?.user.master === true;

	return isRootDashboard ? <DashboardRootAgileecommercePage /> : <DashboardPage />;
}
