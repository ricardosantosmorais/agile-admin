# Batch: .ebextensions

## Legacy commit checked

- `174c82e4b` - `Ajusta health check do admin para ignorar 4xx`
  - Legacy file: `.ebextensions/health-reporting.config`
  - Legacy change: disables Elastic Beanstalk enhanced-health rules for `ApplicationRequests4xx` and `ELBRequests4xx`.

## V2 comparison

- `admin-v2-web` has no `.ebextensions` directory.
- The v2 repository has `amplify.yml`, indicating a different deployment surface from the legacy Elastic Beanstalk configuration committed in `admin`.

## Decision

- Not applicable to v2.
- User confirmed this point can be ignored.

## Result

- No v2 code or infrastructure change required.
- Batch marked as completed in the parity inventory.
