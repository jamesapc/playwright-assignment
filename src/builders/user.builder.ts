import { CreateUserPayload } from "@payloadTypes/user.type";

export function buildCreateUserPayload(overrides: Partial<CreateUserPayload> = {}): CreateUserPayload {
  return {
    name: "Tenali Ramakrishna",
    email: `user_${Date.now()}@example.com`,
    gender: "male",
    status: "active",
    ...overrides,
  };
}
