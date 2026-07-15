const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/authenticate");
const managerController = require("../controllers/managerController");

router.use(authenticate);
router.use(requireRole("manager", "admin"));

router.get("/dashboard",       managerController.getDashboard);
router.get("/employees",       managerController.getEmployees);
router.get("/employees/:id",   managerController.getEmployee);
router.get("/activities",      managerController.getActivities);
router.get("/statistics",      managerController.getStatistics);
router.get("/export/md",       managerController.exportMd);
router.get("/export/pdf",      managerController.exportPdf);

module.exports = router;
