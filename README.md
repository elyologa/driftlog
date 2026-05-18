# driftlog

> Detects config drift between deployed services and their source-of-truth YAML definitions.

---

## Installation

```bash
npm install -g driftlog
# or use it as a dev dependency
npm install --save-dev driftlog
```

---

## Usage

Point driftlog at your YAML definitions and a running service endpoint to check for drift:

```bash
driftlog check --source ./config/services.yaml --env production
```

Example output:

```
✔ auth-service       in sync
✗ payment-service    drift detected
    expected: replicas=3, found: replicas=2
    expected: memory_limit=512Mi, found: memory_limit=256Mi
✔ notification-service  in sync

2 services checked, 1 drift detected.
```

You can also use it programmatically:

```typescript
import { checkDrift } from 'driftlog';

const results = await checkDrift({
  source: './config/services.yaml',
  env: 'production',
});

results.forEach(({ service, drifted, diffs }) => {
  if (drifted) {
    console.log(`${service} has drift:`, diffs);
  }
});
```

---

## Configuration

Add a `driftlog.config.ts` file to your project root to customize behavior:

```typescript
export default {
  source: './config/services.yaml',
  environments: ['staging', 'production'],
  ignoreFields: ['last_deployed_at'],
};
```

---

## License

[MIT](./LICENSE)