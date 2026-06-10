import { test, expect } from "@playwright/test";
import { sendRequest } from "@commons/common";
import { ENDPOINTS } from "@constants/endpoints";
import { userListSchema, userSchema } from "@schemas/user.schema";
import { buildCreateUserPayload } from "@builders/user.builder";
import { readJson } from "@utils/json";
import { CreateUserTestData, UpdateUserTestData } from "@payloadTypes/user.type";
import { APIRequestContext } from "@playwright/test";

const createUserData = readJson<CreateUserTestData>("./data/users.json").find(r => r.test_id === "TC-API-USER-02")!;
const updateUserData = readJson<UpdateUserTestData>("./data/users.json").find(r => r.test_id === "TC-API-USER-05")!;

test.describe.configure({ mode: "serial" });

test.describe("Users API", () => {
  let apiContext: APIRequestContext;
  let userId: number;

  test.beforeAll(async ({ playwright }) => {
    apiContext = await playwright.request.newContext({
      baseURL: process.env.API_BASE_URL + "/",
      extraHTTPHeaders: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test("TC-API-USER-01: GET /users returns array of users with valid schema", async () => {
    const { response, responseBody } = await sendRequest(apiContext, {
      endpoint: ENDPOINTS.USERS,
      method: "get",
    });

    expect(response.status()).toBe(200);
    const users = userListSchema.parse(responseBody);
    expect(users.length).toBeGreaterThan(0);
  });

  test("TC-API-USER-02: POST /users creates a new user and returns 201", async () => {
    const payload = buildCreateUserPayload({ name: createUserData.name, gender: createUserData.gender, status: createUserData.status });

    const { response, responseBody } = await sendRequest(apiContext, {
      endpoint: ENDPOINTS.USERS,
      method: "post",
      data: payload,
    });

    expect(response.status()).toBe(201);
    const user = userSchema.parse(responseBody);
    expect(user.name).toBe(payload.name);
    expect(user.email).toBe(payload.email);

    userId = user.id;
  });

  test("TC-API-USER-03: GET /users/:id returns correct user", async () => {
    const { response, responseBody } = await sendRequest(apiContext, {
      endpoint: `${ENDPOINTS.USERS}/${userId}`,
      method: "get",
    });

    expect(response.status()).toBe(200);
    const user = userSchema.parse(responseBody);
    expect(user.id).toBe(userId);
  });

  test("TC-API-USER-04: GET /users/:id with non-existent id returns 404", async () => {
    const { response, responseBody } = await sendRequest(apiContext, {
      endpoint: `${ENDPOINTS.USERS}/9999999999`,
      method: "get",
    });

    expect(response.status()).toBe(404);
    expect((responseBody as { message: string }).message).toBe("Resource not found");
  });

  test("TC-API-USER-05: PUT /users/:id updates name and status to inactive", async () => {
    const { response, responseBody } = await sendRequest(apiContext, {
      endpoint: `${ENDPOINTS.USERS}/${userId}`,
      method: "put",
      data: { name: updateUserData.name, status: updateUserData.status },
    });

    expect(response.status()).toBe(200);
    const user = userSchema.parse(responseBody);
    expect(user.name).toBe(updateUserData.name);
    expect(user.status).toBe(updateUserData.status);
  });

  test("TC-API-USER-06: GET /users/:id after inactive update still returns 200", async () => {
    const { response, responseBody } = await sendRequest(apiContext, {
      endpoint: `${ENDPOINTS.USERS}/${userId}`,
      method: "get",
    });

    expect(response.status()).toBe(200);
    const user = userSchema.parse(responseBody);
    expect(user.id).toBe(userId);
    expect(user.status).toBe(updateUserData.status);
  });

  test("TC-API-USER-07: DELETE /users/:id returns 204", async () => {
    const { response } = await sendRequest(apiContext, {
      endpoint: `${ENDPOINTS.USERS}/${userId}`,
      method: "delete",
    });

    expect(response.status()).toBe(204);
  });

  test("TC-API-USER-08: GET /users/:id after delete returns 404", async () => {
    const { response, responseBody } = await sendRequest(apiContext, {
      endpoint: `${ENDPOINTS.USERS}/${userId}`,
      method: "get",
    });

    expect(response.status()).toBe(404);
    expect((responseBody as { message: string }).message).toBe("Resource not found");
  });
});
