require("dotenv").config({ path: require("path").resolve(__dirname, "../.env.test") });

const userDataValid = {
    username: "testuser",
    email: "testuser@example.com",
    password: "password123",
    cargo: 1
}; 
const adminDataValid ={
    email: "admin@weeklyreports.local", 
    password: "Admin@12345"
}
const todayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
module.exports = { userDataValid, adminDataValid, todayDate };