import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
	reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
	org: 'agileecommerce-b2b',
	project: 'javascript-nextjs',
	authToken: process.env.SENTRY_AUTH_TOKEN,
	silent: !process.env.CI,
	webpack: {
		treeshake: {
			removeDebugLogging: true,
		},
	},
	sourcemaps: {
		disable: !process.env.SENTRY_AUTH_TOKEN,
		deleteSourcemapsAfterUpload: true,
	},
});
