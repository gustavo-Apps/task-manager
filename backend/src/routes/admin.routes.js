const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const adminController = require("../controllers/adminController");

router.use(authenticate);

router.get("/users",                    adminController.listUsers);
router.post("/users",                   adminController.createUser);
router.patch("/users/:id",              adminController.updateUser);
router.post("/users/:id/reset-password",adminController.resetPassword);
router.delete("/users/:id",             adminController.deleteUser);
router.get("/reports",                  adminController.listAllReports);

module.exports = router;
