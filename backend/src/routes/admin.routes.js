const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const adminController = require("../controllers/adminController");

router.use(authenticate);
router.get("/users",   adminController.listUsers);
router.get("/reports", adminController.listAllReports);

module.exports = router;
