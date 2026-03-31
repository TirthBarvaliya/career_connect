import jwt from "jsonwebtoken";
import config from "../config/env.js";

const generateToken = (userId) =>
  jwt.sign(
    {
      id: userId
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn
    }
  );

export default generateToken;
