import express from 'express';
import { addToHistory, Signup } from '../controller/user.controller.js';
import { login } from '../controller/user.controller.js';
import { getHistory } from '../controller/user.controller.js';

const router = express.Router();

router.post("/signup",Signup);
router.post("/login",login);
router.get("/getHistory",getHistory);
router.post("addHistory",addToHistory);

export default router;