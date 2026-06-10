---
name: test-automation
description: Build and maintain API test automation projects using CSV/JSON-driven data, Playwright, Zod validation, and database assertions. Use when users want to create a new test project, add a new API endpoint test, debug test failures, or follow the test automation workflow.
---

# test-automation

API test automation methodology. Architecture, workflow, conventions, debugging.

See [REFERENCE.md](./REFERENCE.md) for code templates and examples.

## When this skill activates

- "create new test project", "set up test automation"
- "add test for this endpoint", "new API test"
- "test is failing", "debug this test", "why is this test broken"
- "how should I structure this test", "test workflow"
- "add new channel", "add new payment method test"
- "analyze this CSV/JSON", "create requirement from this data"
- "design the test", "create tasks for this test"
- User provides CSV, JSON, curl command, or API spec for testing

---

## Quick Start: Add 1 Test Case to Existing Project

1. Open the CSV/JSON file for that endpoint
2. Add a new row with unique `test_id`
3. Fill request fields + expected fields
4. Done — the `for` loop in the spec picks it up automatically

**When code changes ARE needed:**

| Situation | Update |
|-----------|--------|
| New request field | CSV column → Type → Builder |
| New response field to assert | Zod Schema → Spec assertion |
| New endpoint entirely | Full pipeline: CSV → Type → Builder → Schema → Spec |

---

## Workflow: Analyze → Requirement → Design → Tasks

Follow this process **before writing any code** when receiving new test data:

### Phase 1: Analyze

| Input | Action |
|-------|--------|
| CSV | Analyze columns, identify request vs expected fields, detect sentinel values |
| JSON | Analyze keys/types, identify request vs expected, detect nested structures |
| curl | Extract method, endpoint, headers, body; identify dynamic vs static fields |
| API spec | Identify endpoints, request/response schemas, error codes |
| Description | Ask clarifying questions about fields, responses, error cases |

Output: endpoint, request fields, response fields, success code, error cases, follow-up steps.

### Phase 2: Requirements

Write formal requirements with acceptance criteria (SHALL language). Follow pipeline order: Test Data → Type → Builder → Schema → Spec → DB.

### Phase 3: Design

1. Architecture flow — data movement through pipeline
2. Decision logic — conditional paths (validate-only vs validate-and-notify)
3. Files to create/modify — table of paths and purposes
4. Override/injection pattern — how to inject invalid values for negative tests

### Phase 4: Tasks

Implementable tasks with checkboxes, ordered by pipeline. Each references its requirement.

### Workflow triggers

| Trigger | Action |
|---------|--------|
| User provides CSV/JSON/curl | Analyze → Requirements → Design → Tasks |
| User says "add test for X" | Ask for details → full workflow |
| User says "just do it" | Skip to Tasks (still follow pipeline order) |

### Workflow rules

- Never skip straight to code — confirm plan first
- Requirements must have acceptance criteria
- Design must show decision logic
- Tasks ordered by pipeline
- Wait for user approval between phases (unless "just do it all")

---

## Architecture

```
CSV/JSON → Type → Builder → sendRequest() → Zod Schema → Response Assert → DB Assert
```

| Step | Purpose | Location |
|------|---------|----------|
| Test Data | All inputs + expected outputs | `csv/` or `data/` |
| Type | TypeScript type for row shape | `src/types/{module}/` |
| Builder | Constructs payload from row | `src/builders/{module}/` |
| sendRequest | Single shared HTTP function | `src/commons/common.ts` |
| Zod Schema | Validates response structure | `src/schemas/{module}/` |
| Response Assert | Checks code/message | Inside spec |
| DB Assert | Verifies state change | `src/db/queries/` |

---

## Project Structure

```
project-root/
├── csv/                    # One CSV per endpoint/suite
├── data/                   # One JSON per endpoint/suite
├── src/
│   ├── types/{module}/     # Row type definitions
│   ├── builders/{module}/  # Payload constructors
│   ├── schemas/{module}/   # Zod response schemas
│   ├── commons/            # sendRequest + auth
│   ├── constants/          # Endpoint paths
│   ├── db/queries/         # DB connection + queries
│   ├── config/             # Environment resolution
│   ├── utils/              # CSV/JSON parser, crypto, helpers
│   ├── fixtures/           # Playwright fixtures
│   ├── locators/           # UI selectors (POM)
│   ├── pages/              # Page objects (POM)
│   └── tests/api/{module}/ # Spec files
├── cicd/                   # Pipeline configs
├── .env / .env.example
├── playwright.config.ts
└── tsconfig.json
```

**Path aliases** (never use relative imports):
`@utils/*`, `@types/*`, `@builders/*`, `@commons/*`, `@fixtures/*`, `@schemas/*`, `@db/*`, `@config/*`, `@constants/*`, `@locators/*`, `@pages/*`

---

## Step Rules

### 1. Test Data

| Format | Use when |
|--------|----------|
| CSV | Many cases, flat data, editable in Excel |
| JSON | Nested payloads, mixed types, complex structures |

**CSV column order:** `test_id, test_name, [request_fields...], [expected_fields...], merchant_id_env, secret_key_env, release_tag`

**Rules (both formats):**
- `test_id` unique per row
- Expected fields prefixed with `expected_`
- Credentials: store .env var NAME, not value
- Minimum cases: success, missing field, invalid value

**Sentinel values (CSV only):**

| Value | Resolves to | API receives |
|-------|-------------|--------------|
| `__EMPTY__` | `""` | empty string |
| `__NULL__` | `null` | null |
| `__DYNAMIC__` | runtime value | generated value |
| _(blank)_ | `undefined` | field omitted |

### 2. Type

- Use `type` not `interface`
- CSV: all `string`. JSON: proper types
- Field names match CSV headers / JSON keys exactly

### 3. Builder

- Maps row fields → API payload
- Generates dynamic values (IDs, timestamps, checksums)
- Resolves sentinel values
- Never hardcodes secrets — receives as parameters

### 4. Zod Schema

- One schema per response shape
- `.nullable()` for null fields, never `.optional()` unless truly absent
- Never `z.any()`

### 5. Spec File

- Import `test`/`expect` from fixture — never from `@playwright/test`
- One endpoint per spec file
- `for` loop at top level (no `test.describe()` wrapping)
- Schema validation on success responses only

### 6. npm Script

`"test:{endpoint}": "npx playwright test --project=ete --grep @{endpoint-tag}"`

---

## Multi-Step Flow

When endpoint requires follow-up (notify + DB check):

1. Call main API → assert response → get payment_code
2. IF success: call notify → assert → query DB → assert final state
3. IF error: query DB → assert state unchanged

Use `test.describe.configure({ mode: "serial" })` for dependent steps.

---

## Infrastructure Rules

**Authentication:**
- Token fetched once in `test.beforeAll()`, cached per client
- Auto-refresh at 60s before expiry
- Credentials from `.env`, never hardcoded

**Fixture:**
- `environment` from `project.name` in playwright config
- `apiContext` resolves `baseURL` from `.env` via prefix pattern
- Always `dispose()` after use

**sendRequest:**
- One function for ALL calls (JSON, form, XML, custom headers)
- Base URL from fixture by default; override via `baseUrl` option

**Environment:**
- Pattern: `{ENV_PREFIX}_{KEY}` (e.g., `ETE_BASE_URL`)
- CSV references env var names so same data works across environments

**Endpoint constants:**
- All paths in `src/constants/endpoints.ts`, UPPER_SNAKE_CASE
- Never hardcode strings in specs

**Database:**
- Parameterized queries only
- Pool shared per worker, closed in `afterAll`
- Return `null` when not found (let test assert)

---

## Debugging

| Symptom | Cause | Fix |
|---------|-------|-----|
| response_code "01" | Wrong checksum/credentials | Print env var name + resolved value |
| response_code "02" | Expired token | Check .env values for target env |
| Zod error: undefined field | Response changed or CSV shifted | Compare actual response vs schema |
| Expected "00" got "01" | Wrong/missing payload field | Log full payload, compare with curl |
| DB assertion null | Prior step didn't succeed | Assert after each step |
| Timeout | Wrong base URL | Print full URL being called |
| Cannot read undefined | CSV column misalignment | Count commas in row vs header |

**Debug order:** CSV row → env vars → built payload → full URL → compare with curl → raw response → DB query

**CSV misalignment** (most common silent bug): unquoted comma in value, missing field, extra comma at end.

---

## Conventions

**Naming:**
- Files: kebab-case (`start-payment.ts`)
- Test: `[{test_id}][{PLATFORM}][{ROLE}][{api}] - {name} - response {code} : {message}`
- Tags: `@{endpoint-name}`, `@{release-tag}`

**Code rules:**
- All data from CSV/JSON — never hardcode in specs
- Secrets from `.env` only
- Endpoints from `@constants/endpoints`
- `type` not `interface`
- Path aliases always
- One endpoint per spec
- Single shared `sendRequest`
- Zod on every success response

---

## Anti-Patterns

| Don't | Do | Why |
|-------|-----|-----|
| `test.describe()` wrapping data loop | `for` loop at top level | No value for data-driven |
| Share mutable state between tests | Each test builds own payload | Parallel corruption |
| `waitForTimeout(3000)` | `expect(locator).toBeVisible()` | Flaky vs reliable |
| Catch errors and return null | Let test fail with real error | Hides bugs |
| `z.any()` | Real types | Defeats validation |
| Fetch token per test | `beforeAll` + cache | N requests waste |
| `expect(x).toBeTruthy()` | `expect(x).toBe(expected)` | Hides wrong values |
| `test.setTimeout(120000)` | Fix root cause | Masks problems |

---

## Test Isolation

| Scenario | Mode |
|----------|------|
| Independent rows | Parallel (default, workers: 4) |
| Steps depend on prior output | Serial (`test.describe.configure`) |
| Shared token, independent data | Parallel + `beforeAll` |

---

## UI Testing (Page Object Model)

```
Locators (selectors only) → Pages (actions + assertions) → Spec (orchestration)
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Locators | `src/locators/{page}.ts` | Selector strings only |
| Pages | `src/pages/{page}.ts` | Actions + assertions |
| Spec | `src/tests/` | Orchestration |

**Locator rules:** one `const` object per page, descriptive names, prefer `data-testid` > `id` > `class` > XPath

**Page rules:** constructor receives `Page`, creates Locators from locator file, methods are actions or assertions, `readonly` properties

---

## CI/CD

**Pipeline:** install deps → install browser → run tests → publish HTML report

**Parameterized:** environment + tag filter + browser at runtime

**Secrets:** Jenkins credentials / Vault / K8s secrets → env vars matching `{ENV}_SECRET_KEY` pattern

---

## Dependencies

`@playwright/test`, `zod`, `csv-parse`, `mssql`, `dotenv`, `typescript`, `@types/mssql`
