# Auto Label PR

A GitHub Action that automatically labels pull requests based on the file paths that were changed.

## Usage

### 1. Create a config file

Create `.github/auto-label.yml` in your repository:

```yaml
frontend:
  - 'src/components/**'
  - 'src/pages/**'
  - '**/*.tsx'
  - '**/*.css'

backend:
  - 'src/api/**'
  - 'src/services/**'
  - '**/*.py'

devops:
  - 'Dockerfile'
  - 'docker-compose*.yml'
  - '.github/workflows/**'
  - 'terraform/**'

docs:
  - '**/*.md'
  - 'docs/**'

tests:
  - '**/*.test.*'
  - '**/*.spec.*'
  - 'tests/**'
```

### 2. Create a workflow

Create `.github/workflows/auto-label.yml`:

```yaml
name: Auto Label PR
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: zspirit/auto-label-pr@v1
```

### Configuration

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `token` | GitHub token | No | `github.token` |
| `config` | Path to label config file | No | `.github/auto-label.yml` |

### Output

| Output | Description |
|--------|-------------|
| `labels` | Comma-separated list of labels added |

## Examples

### Monorepo setup

```yaml
# .github/auto-label.yml
frontend:
  - 'packages/web/**'
  - 'packages/ui/**'

backend:
  - 'packages/api/**'
  - 'packages/server/**'

mobile:
  - 'packages/mobile/**'

infrastructure:
  - 'infra/**'
  - 'k8s/**'
```

## License

MIT
