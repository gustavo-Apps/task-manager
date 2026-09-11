const app = require("../../src/app");
const register = require("../../src/services/taskService");
const request = require('supertest');
const { userDataValid, adminDataValid, todayDate } = require("../setupEnv");

let validToken;
test("Create simple task with valid data", async () => {
    const taskData = {
        title: "Test Task",
        task_date: todayDate(),
        activity_type_id: 1,
        task_status_id: 1
    }
    const response = await request(app)
    .post("/api/tasks")
    .set("Authorization", `Bearer ${validToken}`)
    .send(taskData);
    // console.log("Response body:", response.body);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.task).toHaveProperty("id");
    expect(response.body.data.task.title).toBe(taskData.title);
    expect(response.body.data.task.task_date).toBe(taskData.task_date);
    expect(response.body.data.task.activity_type_id).toBe(taskData.activity_type_id);
    expect(response.body.data.task.task_status_id).toBe(taskData.task_status_id);
});

test("Create complex task with valid data", async () => {
    const taskData = {
        title: "Test Task",
        task_date: todayDate(),
        activity_type_id: 4,
        task_status_id: 3,
        azure_ticket_id: "2000",
        description: "This is a test task with all fields filled.",
        task_end_date: todayDate(),
        discord_link: "https://discord.com/test",
        notes: "These are some test notes."
    }
    const response = await request(app)
    .post("/api/tasks")
    .set("Authorization", `Bearer ${validToken}`)
    .send(taskData);
    // console.log("Response body:", response.body);

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.task).toHaveProperty("id");
    expect(response.body.data.task.title).toBe(taskData.title);
    expect(response.body.data.task.task_date).toBe(taskData.task_date);
    expect(response.body.data.task.activity_type_id).toBe(taskData.activity_type_id);
    expect(response.body.data.task.task_status_id).toBe(taskData.task_status_id);
    expect(response.body.data.task.azure_ticket_id).toBe(taskData.azure_ticket_id);
    expect(response.body.data.task.description).toBe(taskData.description);
    expect(response.body.data.task.task_end_date).toBe(taskData.task_end_date);
    expect(response.body.data.task.discord_link).toBe(taskData.discord_link);
    expect(response.body.data.task.notes).toBe(taskData.notes);
});

test("Create task without title but with azure_ticket_id", async () => {
    const taskData = {
        task_date: todayDate(),
        activity_type_id: 4,
        task_status_id: 3,
        azure_ticket_id: "2000",
        description: "This is a test task with all fields filled.",
        task_end_date: todayDate()
    }
    const response = await request(app)
    .post("/api/tasks")
    .set("Authorization", `Bearer ${validToken}`)
    .send(taskData);
    // console.log("Response body:", response.body);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("data");
    expect(response.body.data.task).toHaveProperty("id");
    expect(response.body.data.task.title).toBe("Testado Hoje");
    expect(response.body.data.task.azure_ticket_id).toBe(taskData.azure_ticket_id);
    expect(response.body.data.task.description).toBe(taskData.description);
    expect(response.body.data.task.task_end_date).toBe(taskData.task_end_date);
});

test("Create invalid task without required fields", async () => {
    const taskData = {
        description: "This is a test task with missing required fields."
    }
    const response = await request(app)
    .post("/api/tasks")
    .set("Authorization", `Bearer ${validToken}`)
    .send(taskData);

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Dados inválidos.");
});

test("Get Task List with valid token", async () => {
    const response = await request(app)
    .get("/api/tasks")
    .set("Authorization", `Bearer ${validToken}`);
    
    console.log("Response body:", response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("data");
    expect(Array.isArray(response.body.data.tasks)).toBe(true);
    expect(response.body.data.tasks.length).toBeGreaterThan(0);
});
test("Get Task List with invalid token", async () => {
    const response = await request(app)
    .get("/api/tasks")
    .set("Authorization", `Bearer invalidtoken`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Token inválido ou expirado.");
});

beforeAll(async () =>{
    const response = await request(app)
    .post("/api/auth/login")
    .send({ email: adminDataValid.email, password: adminDataValid.password }); 
    validToken = response.body.data.token;
});