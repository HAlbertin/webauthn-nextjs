'use server';

import { ENV } from '@/constants/env';
import { JWTPayload, SignJWT, jwtVerify } from 'jose';

export const signJwt = async (payload: JWTPayload) => {
  const secret = ENV.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not defined');
  }
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(new TextEncoder().encode(secret));
};

export const verifyJwt = async (jwt: string) => {
  const secret = ENV.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not defined');
  }

  const { payload } = await jwtVerify(jwt, new TextEncoder().encode(secret));
  return payload;
};
