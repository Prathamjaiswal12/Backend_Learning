import jwt from "jsonwebtoken";
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'access_secret';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

/**
 * Generates access and refresh tokens for a user
 * @param {string} userId
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export async function generateAccessAndRefereshTokens(userId) {
  const accessToken = jwt.sign({ userId }, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId }, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  return { accessToken, refreshToken };
}