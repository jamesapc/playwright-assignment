# REFERENCE — Code Templates & Patterns

Implementation templates for the test-automation skill. See [SKILL.md](./SKILL.md) for workflow and conventions.

---

## tsconfig.json — Path Aliases

```json
{
  "compilerOptions": {
    "paths": {
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"],
      "@builders/*": ["./src/builders/*"],
      "@commons/*": ["./src/commons/*"],
      "@fixtures/*": ["./src/fixtures/*"],
      "@schemas/*": ["./src/schemas/*"],
      "@db/*": ["./src/db/*"],
      "@config/*": ["./src/config/*"],
      "@constants/*": ["./src/constants/*"],
      "@locators/*": ["./src/locators/*"],
      "@pages/*": ["./src/pages/*"]
    }
  }
}
```

---

## Test Data

### CSV — `csv/{endpoint}.csv`

```csv
test_id,test_name,amount,currency_code,merchant_id_env,secret_key_env,expected_response_code,expected_response_message,release_tag
TC-001,success case,400.00,THB,ETE_MERCHANT_ID,ETE_SECRET_KEY,00,success,@v1.0
TC-002,missing amount,__EMPTY__,THB,ETE_MERCHANT_ID,ETE_SECRET_KEY,01,invalid request,@v1.0
TC-003,invalid checksum,400.00,THB,ETE_MERCHANT_ID,WRONG_KEY_ENV,01,invalid checksum,@v1.0
```

### JSON — `data/{endpoint}.json`

```json
[
  {
    "test_id": "TC-001",
    "test_name": "success case",
    "amount": 400.00,
    "currency": "THB",
    "merchant_id_env": "ETE_MERCHANT_ID",
    "secret_key_env": "ETE_SECRET_KEY",
    "expected_response_code": "00",
    "expected_response_message": "success",
    "release_tag": "@v1.0"
  }
]
```

---

## Type Definition

File: `src/types/{module}/{endpoint}.ts`

```typescript
// CSV variant (all strings):
export type StartPaymentTestData = {
  test_id: string;
  test_name: string;
  amount: string;
  currency_code: string;
  expected_response_code: string;
  expected_response_message: string;
  merchant_id_env: string;
  secret_key_env: string;
  release_tag: string;
};

// JSON variant: replace string with proper types (number | null, boolean, etc.)
```

---

## Builder

File: `src/builders/{module}/{endpoint}.ts`

```typescript
import { StartPaymentTestData } from "@types/{module}/{endpoint}";
import { resolveRow, removeUndefined } from "@utils/sentinel";

export function buildPayload(row: StartPaymentTestData, merchantId: string, secretKey: string) {
  const merchantReference = generateUniqueReference();
  const resolved = resolveRow(row, { merchant_reference: merchantReference });
  const checksum = computeChecksum(merchantId + merchantReference + resolved.amount, secretKey);

  const payload = removeUndefined({
    amount: resolved.amount,
    currency_code: resolved.currency_code,
    merchant_id: merchantId,
    merchant_reference: merchantReference,
    checksum,
  });

  return { payload, merchantReference };
}
```

---

## Sentinel Resolver

File: `src/utils/sentinel.ts`

```typescript
type DynamicValues = Record<string, string>;

export function resolveRow<T extends Record<string, string>>(
  row: T,
  dynamicValues: DynamicValues = {},
): Record<string, string | null | undefined> {
  const resolved: Record<string, string | null | undefined> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === "__EMPTY__") resolved[key] = "";
    else if (value === "__NULL__") resolved[key] = null;
    else if (value === "__DYNAMIC__") resolved[key] = dynamicValues[key];
    else if (value === "") resolved[key] = undefined;
    else resolved[key] = value;
  }
  return resolved;
}

export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}
```

---

## Zod Schema

File: `src/schemas/{module}/{endpoint}.ts`

```typescript
import { z } from "zod";

export const startPaymentResponseSchema = z.object({
  response_code: z.string(),
  response_message: z.string(),
  payment_code: z.string(),
  amount: z.number(),
  currency_code: z.string(),
  optional_field: z.string().nullable(),
});
```

---

## Spec File

File: `src/tests/api/{module}/{endpoint}.spec.ts`

```typescript
import { test, expect } from "@fixtures/apicontext.fixture";
import { sendRequest } from "@commons/common";
import { readCsv } from "@utils/csv";
import { ENDPOINTS } from "@constants/endpoints";
import { StartPaymentTestData } from "@types/{module}/{endpoint}";
import { buildPayload } from "@builders/{module}/{endpoint}";
import { startPaymentResponseSchema } from "@schemas/{module}/{endpoint}";

const testData = readCsv<StartPaymentTestData>("./csv/{endpoint}.csv");
// For JSON: const testData = readJson<StartPaymentTestData>("./data/{endpoint}.json");

for (const row of testData) {
  test(
    `[${row.test_id}][MODULE][ROLE][{endpoint}] - ${row.test_name} - response ${row.expected_response_code} : ${row.expected_response_message}`,
    { tag: row.release_tag ? ["@{endpoint-tag}", row.release_tag] : "@{endpoint-tag}" },
    async ({ apiContext }) => {
      const merchantId = process.env[row.merchant_id_env] || "";
      const secretKey = process.env[row.secret_key_env] || "";
      const { payload } = buildPayload(row, merchantId, secretKey);

      const { response, responseBody } = await sendRequest(apiContext, {
        endpoint: ENDPOINTS.START_PAYMENT,
        data: payload,
      });

      expect(response.status()).toBe(200);
      expect(responseBody.response_code).toBe(row.expected_response_code);
      expect(responseBody.response_message).toBe(row.expected_response_message);

      if (row.expected_response_code === "00") {
        startPaymentResponseSchema.parse(responseBody);
      }
    },
  );
}
```

---

## Multi-Step Flow

```typescript
test.describe.configure({ mode: "serial" });

test.describe("full payment flow", () => {
  let paymentCode: string;

  test.afterAll(async () => { await closeDbPool(); });

  test("step 1: create", async ({ apiContext }) => {
    const { responseBody } = await sendRequest(apiContext, { endpoint: ENDPOINTS.START_PAYMENT, data: payload });
    expect(responseBody.response_code).toBe("00");
    paymentCode = responseBody.payment_code;
  });

  test("step 2: notify", async ({ apiContext }) => {
    const { responseBody } = await sendRequest(apiContext, {
      endpoint: ENDPOINTS.NOTIFY,
      baseUrl: process.env.NOTIFY_BASE_URL || "",
      data: buildNotifyPayload(row, paymentCode),
    });
    expect(responseBody.response_code).toBe(row.expected_notify_code);
  });

  test("step 3: DB verify", async ({ environment }) => {
    const record = await getTransaction(paymentCode, environment);
    expect(record).toBeTruthy();
    expect(record.STATUS).toBe(row.expected_db_status);
  });
});
```

---

## sendRequest

File: `src/commons/common.ts`

```typescript
import { APIRequestContext } from "@playwright/test";

interface RequestOptions {
  endpoint: string;
  data?: object | string;
  form?: Record<string, string>;
  headers?: Record<string, string>;
  method?: "post" | "get" | "put" | "delete";
  baseUrl?: string;
}

export async function sendRequest(apiContext: APIRequestContext, options: RequestOptions) {
  const { endpoint, data, form, headers, method = "post", baseUrl } = options;
  const url = baseUrl ? `${baseUrl}/${endpoint}` : endpoint;

  const response = await apiContext[method](url, {
    ...(data && { data }),
    ...(form && { form }),
    ...(headers && { headers }),
    timeout: 30000,
  });

  const responseText = await response.text();
  if (!response.ok()) {
    console.warn(`[sendRequest] ${method.toUpperCase()} ${url} → ${response.status()}`);
    console.warn(`[sendRequest] Response: ${responseText.substring(0, 500)}`);
  }

  const responseBody = responseText.startsWith("{") || responseText.startsWith("[")
    ? JSON.parse(responseText)
    : { raw: responseText };

  return { response, responseBody };
}
```

---

## Authentication

File: `src/commons/auth.ts`

```typescript
import { APIRequestContext } from "@playwright/test";

interface TokenConfig {
  oauthUrl: string;
  clientId: string;
  clientSecret: string;
  contentType?: "form" | "json";
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getAccessToken(apiContext: APIRequestContext, config: TokenConfig): Promise<string> {
  const cacheKey = `${config.oauthUrl}_${config.clientId}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt - 60000) return cached.token;

  const body = { grant_type: "client_credentials", client_id: config.clientId, client_secret: config.clientSecret };
  const response = await apiContext.post(config.oauthUrl, {
    ...(config.contentType === "json" ? { data: body } : { form: body }),
  });
  const resBody = await response.json();

  tokenCache.set(cacheKey, { token: resBody.access_token, expiresAt: Date.now() + resBody.expires_in * 1000 });
  return resBody.access_token;
}
```

**Usage:** `test.beforeAll` → `getAccessToken()` → pass via `headers: { Authorization: \`Bearer ${token}\` }` in sendRequest.

---

## Fixture

File: `src/fixtures/apicontext.fixture.ts`

```typescript
import { test as base, APIRequestContext } from "@playwright/test";
import { getConfigVar } from "@config/project.config";

type TestFixtures = { apiContext: APIRequestContext; environment: string };

export const test = base.extend<TestFixtures>({
  environment: [async ({}, use, testInfo) => {
    await use(testInfo.project.name);
  }, { scope: "test" }],

  apiContext: [async ({ playwright, environment }, use) => {
    const context = await playwright.request.newContext({
      baseURL: getConfigVar("BASE_URL", environment),
      extraHTTPHeaders: { "Content-Type": "application/json" },
    });
    await use(context);
    await context.dispose();
  }, { scope: "test" }],
});

export { expect } from "@playwright/test";
```

---

## Environment Config

File: `src/config/project.config.ts`

```typescript
const prefixMap: Record<string, string> = { ete: "ETE", sandbox: "SANDBOX", prod: "PROD" };

export function getConfigVar(key: string, environment: string): string {
  const prefix = prefixMap[environment];
  if (!prefix) throw new Error(`Unknown environment: ${environment}`);
  const envVarName = `${prefix}_${key}`;
  const value = process.env[envVarName];
  if (!value) throw new Error(`Missing: ${envVarName}`);
  return value;
}
```

### .env

```bash
ETE_BASE_URL=https://ete-api.example.com
ETE_MERCHANT_ID=merchant_ete@shop.com
ETE_SECRET_KEY=ABC123...
ETE_DB_HOST=10.0.1.100
ETE_DB_NAME=PaymentDB
ETE_DB_USER=sa
ETE_DB_PASSWORD=secret123
```

---

## Endpoint Constants

File: `src/constants/endpoints.ts`

```typescript
export const ENDPOINTS = {
  START_PAYMENT: "start-payment",
  START_OFFLINE: "start-offline-payment",
  GET_STATUS: "get-payment-status",
  NOTIFY: "notify-payment",
};
```

---

## Database

File: `src/db/connection.ts`

```typescript
import sql from "mssql";
import { getConfigVar } from "@config/project.config";

let pool: sql.ConnectionPool | null = null;

export async function getDbPool(environment: string): Promise<sql.ConnectionPool> {
  if (pool?.connected) return pool;
  pool = await sql.connect({
    server: getConfigVar("DB_HOST", environment),
    database: getConfigVar("DB_NAME", environment),
    user: getConfigVar("DB_USER", environment),
    password: getConfigVar("DB_PASSWORD", environment),
    options: { encrypt: true, trustServerCertificate: true },
    pool: { max: 5, min: 1, idleTimeoutMillis: 30000 },
  });
  return pool;
}

export async function closeDbPool(): Promise<void> {
  if (pool?.connected) { await pool.close(); pool = null; }
}
```

File: `src/db/queries/{module}.ts`

```typescript
import { getDbPool } from "@db/connection";

export async function getTransaction(paymentCode: string, environment: string) {
  const pool = await getDbPool(environment);
  const result = await pool.request()
    .input("paymentCode", paymentCode)
    .query("SELECT TOP 1 * FROM TRANSACTIONS WHERE PAYMENT_CODE = @paymentCode");
  return result.recordset[0] || null;
}
```

---

## Data Readers

```typescript
// src/utils/csv.ts
import fs from "fs";
import { parse } from "csv-parse/sync";

export function readCsv<T>(filePath: string): T[] {
  return parse(fs.readFileSync(filePath, "utf-8"), { columns: true, skip_empty_lines: true }) as T[];
}

// src/utils/json.ts
export function readJson<T>(filePath: string): T[] {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T[];
}
```

---

## UI Page Object Model

### Locator — `src/locators/{page}.ts`

```typescript
export const paymentPageLocators = {
  submitButton: "[data-testid='submit']",
  amountField: "#amount",
  statusLabel: ".payment-status",
  errorMessage: "[data-testid='error-msg']",
};
```

### Page — `src/pages/{page}.ts`

```typescript
import { Page, Locator, expect } from "@playwright/test";
import { paymentPageLocators } from "@locators/{page}";

export class PaymentPage {
  readonly submitButton: Locator;
  readonly amountField: Locator;
  readonly statusLabel: Locator;

  constructor(private page: Page) {
    this.submitButton = page.locator(paymentPageLocators.submitButton);
    this.amountField = page.locator(paymentPageLocators.amountField);
    this.statusLabel = page.locator(paymentPageLocators.statusLabel);
  }

  async fillAmount(amount: string) { await this.amountField.fill(amount); }
  async submit() { await this.submitButton.click(); }
  async expectStatus(text: string) { await expect(this.statusLabel).toContainText(text, { timeout: 15000 }); }
}
```

---

## Playwright Config

```typescript
import { defineConfig } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  testDir: "./src/tests",
  timeout: 60000,
  retries: 0,
  workers: 4,
  reporter: [["html", { open: "never", outputFolder: "playwright-report" }], ["list"]],
  projects: [
    { name: "ete", testMatch: /.*\.spec\.ts/ },
    { name: "sandbox", testMatch: /.*\.spec\.ts/ },
    { name: "prod", testMatch: /.*\.spec\.ts/ },
  ],
});
```

---

## package.json

```json
{
  "devDependencies": {
    "@playwright/test": "^1.45.0",
    "zod": "^3.23.0",
    "csv-parse": "^5.5.0",
    "mssql": "^11.0.0",
    "dotenv": "^16.4.0",
    "typescript": "^5.5.0",
    "@types/mssql": "^9.1.0"
  },
  "scripts": {
    "test:ete": "npx playwright test --project=ete",
    "test:sandbox": "npx playwright test --project=sandbox",
    "test:payment": "npx playwright test --project=ete --grep @start-payment",
    "report": "npx playwright show-report"
  }
}
```

---

## CI/CD — Jenkinsfile

```groovy
pipeline {
  agent { kubernetes { yaml readTrusted('cicd/pod-template.yaml') } }
  parameters {
    choice(name: 'ENVIRONMENT', choices: ['ete', 'sandbox'])
    string(name: 'TAG_FILTER', defaultValue: '')
  }
  environment {
    ETE_BASE_URL    = credentials('ete-base-url')
    ETE_MERCHANT_ID = credentials('ete-merchant-id')
    ETE_SECRET_KEY  = credentials('ete-secret-key')
  }
  stages {
    stage('Install') { steps { sh 'npm ci'; sh 'npx playwright install chromium --with-deps' } }
    stage('Test') { steps { script {
      def grep = params.TAG_FILTER ? "--grep '${params.TAG_FILTER}'" : ""
      sh "npx playwright test --project=${params.ENVIRONMENT} ${grep}"
    }}}
  }
  post { always { publishHTML(target: [reportDir: 'playwright-report', reportFiles: 'index.html', reportName: 'Playwright Report']) } }
}
```

### Pod template — `cicd/pod-template.yaml`

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: playwright
      image: mcr.microsoft.com/playwright:v1.45.0-jammy
      command: ['sleep', 'infinity']
      resources:
        requests: { memory: "2Gi", cpu: "1" }
        limits: { memory: "4Gi", cpu: "2" }
```
