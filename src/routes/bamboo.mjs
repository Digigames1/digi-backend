import express from "express";
import { bambooExportRouter } from "./bamboo-export.mjs";
import { bambooMatrixRouter } from "./bamboo-matrix.mjs";

export const bambooRouter = express.Router();

bambooRouter.use(bambooExportRouter);
bambooRouter.use(bambooMatrixRouter);

export default bambooRouter;
