import { Router } from "express";
import {
    createTable,
    getAllTables,
    getTable,
    updateTable,
    deleteTable,
    getAvailableTables,
} from "../../controllers/api/table.controllers.js";
import { auth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", auth, createTable);
router.get("/available", getAvailableTables); 
router.get("/", getAllTables);
router.get("/:id", getTable);
router.put("/:id", auth, updateTable);
router.delete("/:id", auth, deleteTable);

export default router;