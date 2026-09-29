const app = require("../../src/app");
const register = require("../../src/services/authService");
const request = require('supertest');
const userDataValid = require("../setupEnv").userDataValid;
let createdUserId;
test("Register a new user", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send(userDataValid);
  
  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty("data");
  expect(response.body.data.user).toHaveProperty("cargo", userDataValid.cargo);

  expect(response.body.data.user).toHaveProperty("id");
  expect(response.body.data.user).toHaveProperty("username", userDataValid.username);
  expect(response.body.data.user).toHaveProperty("email", userDataValid.email);
  expect(response.body.data.user).toHaveProperty("cargo", userDataValid.cargo);
  createdUserId = response.body.data.user.id;
});

test("Invalid registration data should return 400", async () => {
  const invalidUsernameLowChar = "ER";
  const invalidUsernameHighChar = "ER".repeat(30);
  const invalidEmail = "invalid-email";
  const invalidPasswordLowChar = "12";
  const invalidPasswordHighChar = "a".repeat(73);
  const invalidCargoLow = 0;
  const invalidCargoHigh = 6;

  const invalidData = [
    { username: invalidUsernameLowChar, email: invalidEmail, password: invalidPasswordLowChar, cargo: invalidCargoLow },
    { username: invalidUsernameHighChar, email: invalidEmail, password: invalidPasswordLowChar, cargo: invalidCargoLow },
    { username: invalidUsernameLowChar, email: invalidEmail, password: invalidPasswordHighChar, cargo: invalidCargoLow },
    { username: invalidUsernameLowChar, email: invalidEmail, password: invalidPasswordLowChar, cargo: invalidCargoHigh },
  ];
  for (const data of invalidData) {
    const response = await request(app)
      .post("/api/auth/register")
      .send(data);
    expect(response.status).toBe(400);
  }
});

test("E-mail already exists, return 409", async() => {
  const response =  await request(app)
    .post("/api/auth/register")
    .send(userDataValid);
  expect(response.status).toBe(409);
})

afterAll(async () => {
  if(!createdUserId) return;

  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@weeklyreports.local", password: "Admin@12345" });
  const adminToken = loginRes.body.data.token;
  await request(app)
    .delete(`/api/admin/users/${createdUserId}`)
    .set(`Authorization`, `Bearer ${adminToken}`);
  createdUserId = 0;
});