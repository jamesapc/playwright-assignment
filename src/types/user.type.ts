export type CreateUserPayload = {
  name: string;
  email: string;
  gender: "male" | "female";
  status: "active" | "inactive";
};

export type CreateUserTestData = {
  test_id: string;
  name: string;
  gender: "male" | "female";
  status: "active" | "inactive";
};

export type UpdateUserTestData = {
  test_id: string;
  name: string;
  status: "active" | "inactive";
};
