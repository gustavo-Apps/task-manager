const router = require("express").Router();
const { authenticate } = require("../middleware/authenticate");
const wh = require("../controllers/webhookController");

router.use(authenticate);

router.get("/",        wh.list);
router.post("/",       wh.create);
router.patch("/:id",   wh.update);
router.delete("/:id",  wh.remove);
router.post("/:id/test", wh.test);

module.exports = router;
