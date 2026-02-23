import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";


export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) =>
    extractedErrors.push({
      [err.path]: err.msg,
    })
  );
  next(new ApiError(422, "Received data is not valid", extractedErrors));
};

import jwt from "jsonwebtoken";
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret';

export const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "No token provided"));
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    next(new ApiError(401, "Invalid or expired token"));
  }
};