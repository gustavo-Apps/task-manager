require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.test") });

const userDataValid = {
    username: "testuser",
    email: "testuser@example.com",
    password: "password123",
    cargo: 1
}; 
module.exports = { userDataValid };