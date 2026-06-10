# playwright-assignment

End-to-end UI test automation for an **e-commerce application** using Playwright and TypeScript.

## Setup

```bash
npm install
npx playwright install
```

Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

## Running Tests

```bash
# All tests (UI + API, all browsers)
npm test

# UI tests only (all browsers)
npm run test:ui

# API tests only
npm run test:api

# UI tests on Chrome only
npm run test:ui:chrome

# Headed mode (visible browser, Chrome)
npm run test:headed

# Debug mode
npm run test:debug

# Open HTML report
npm run report
```

Or run directly with Playwright:

```bash
# Interactive UI mode
npx playwright test --ui

# Specific spec file
npx playwright test src/tests/ui/auth.spec.ts --project=chromium
```

## Stack

- [Playwright](https://playwright.dev) — test runner & browser automation
- TypeScript — strict typing throughout
- Zod — API response schema validation
- Path aliases — `@locators/*`, `@commons/*`, `@data/*`, etc. (no relative imports)

## Project Structure

```
playwright-assignment/
├── data/
│   ├── credentials.json        # Test user credentials
│   ├── products.json           # Expected product catalog
│   └── users.json              # API test data
├── src/
│   ├── builders/               # Payload constructors
│   ├── commons/
│   │   ├── auth.ts             # login() helper
│   │   └── common.ts           # sendRequest() for API calls
│   ├── config/
│   │   └── project.config.ts   # Environment variable resolution
│   ├── constants/
│   │   └── endpoints.ts        # API endpoint constants
│   ├── fixtures/
│   │   └── apicontext.fixture.ts
│   ├── locators/
│   │   ├── login.locators.ts
│   │   ├── inventory.locators.ts
│   │   ├── cart.locators.ts
│   │   ├── checkout.locators.ts
│   │   └── product-detail.locators.ts
│   ├── schemas/
│   │   └── user.schema.ts      # Zod schemas
│   ├── types/
│   │   └── user.type.ts        # Payload types
│   ├── tests/
│   │   ├── api/
│   │   │   └── users.spec.ts   # Users CRUD API tests
│   │   └── ui/
│   │       ├── auth.spec.ts
│   │       ├── inventory.spec.ts
│   │       ├── cart.spec.ts
│   │       └── checkout.spec.ts
│   └── utils/
│       ├── csv.ts
│       └── json.ts
├── .env.example
├── playwright.config.ts
└── tsconfig.json
```

## Test Cases

### Authentication (`auth.spec.ts`)
| ID | Description |
|----|-------------|
| TC-AUTH-01 | Valid login redirects to inventory and shows correct products |
| TC-AUTH-02 | Locked out user sees error message |
| TC-AUTH-03 | Empty username shows validation error |
| TC-AUTH-04 | Empty password shows validation error |
| TC-AUTH-05 | Wrong password shows error message |
| TC-AUTH-06 | Logout returns to login page, re-login shows correct products |
| TC-AUTH-07 | Direct access to `/inventory.html` without login redirects to login |
| TC-AUTH-08 | Performance glitch user must redirect within 3s (performance SLA) |

### Inventory (`inventory.spec.ts`)
| ID | Description |
|----|-------------|
| TC-INV-DETAIL-* | Click each product navigates to correct detail page with correct name & price |
| TC-INV-SORT-01 | Sort by Name A→Z |
| TC-INV-SORT-02 | Sort by Name Z→A |
| TC-INV-SORT-03 | Sort by Price low→high |
| TC-INV-SORT-04 | Sort by Price high→low |

### Cart (`cart.spec.ts`)
| ID | Description |
|----|-------------|
| TC-CART-01 | Add 3 items — badge increments and buttons change to Remove |
| TC-CART-02 | Remove item — badge decrements and button reverts to Add to cart |
| TC-CART-03 | Add items, verify in cart page, remove all, return to inventory — badge gone |

### Checkout (`checkout.spec.ts`)
| ID | Description |
|----|-------------|
| TC-CHECKOUT-01 | Fill info → order summary with items, subtotal, tax (8%), total |
| TC-CHECKOUT-02 | Complete order → verify success page text |

### Users API (`users.spec.ts`)
| ID | Description |
|----|-------------|
| TC-API-USER-01 | GET /users → array with valid Zod schema |
| TC-API-USER-02 | POST /users → 201 + created user |
| TC-API-USER-03 | GET /users/:id → correct user |
| TC-API-USER-04 | GET /users/9999999999 → 404 not found |
| TC-API-USER-05 | PUT /users/:id → update name & status |
| TC-API-USER-06 | GET inactive user → still 200 |
| TC-API-USER-07 | DELETE /users/:id → 204 |
| TC-API-USER-08 | GET deleted user → 404 |

## Browsers

UI tests run on **Chromium**, **Firefox**, and **WebKit** by default.
API tests run on the **api** project (no browser).

## Base URLs

| Project | URL |
|---------|-----|
| UI | `https://www.saucedemo.com` |
| API | `https://gorest.co.in/public/v2` |
