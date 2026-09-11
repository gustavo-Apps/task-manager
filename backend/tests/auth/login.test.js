const app = require("../../src/app");
const register = require("../../src/services/authService");
const request = require('supertest');
const { userDataValid } = require("../setupEnv");
let createdUserId;
test("Login with valid credentials", async () => {
   const response = await request(app)
    .post("/api/auth/login")
    .send({ email: userDataValid.email, password: userDataValid.password }); 
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("ok", true);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data).toHaveProperty("token");
});
test("Login with invalid credentials", async () => {
    const response = await request(app)
    .post("/api/auth/login")
    .send({ email: userDataValid.email, password: "wrongpassword" });
    console.log(response.body);
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("ok", false);
    expect(response.body).toHaveProperty("message", "Email ou senha invalidos.");
});

beforeAll(async () =>{
    const response = await request(app)
    .post("/api/auth/register")
    .send(userDataValid);
    if(response.status == 409) return; // Usuário já existe, não precisa criar
    createdUserId = response.body.data.user.id;
});

afterAll(async () => {
  if(!createdUserId) return;
  // Realiza login para pegar token bearer Admin
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin@weeklyreports.local", password: "Admin@12345" });
  const adminToken = loginRes.body.data.token;
  
  // deleta user de teste
  await request(app)
    .delete(`/api/admin/users/${createdUserId}`)
    .set(`Authorization`, `Bearer ${adminToken}`);
  createdUserId = 0;
});