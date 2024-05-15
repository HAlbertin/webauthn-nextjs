'use server';

import { ENV } from '@/constants/env';
import { signJwt } from '@/utils/jwt';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';
import { sql } from '@vercel/postgres';
import { cookies } from 'next/headers';

// TODO: split into separate methods each responsability
const login = async ({
  email,
  authRes,
  options,
}: {
  email: string;
  authRes: AuthenticationResponseJSON;
  options: PublicKeyCredentialRequestOptionsJSON;
}) => {
  try {
    // TODO: use an ORM to handle this
    const { rows: credentialRow } = await sql`SELECT 
      users.id as user_id,
      credentials.id, 
      credentials.transports,
      credentials.counter,
      credentials.public_key
    from users
    left join credentials on users.id = credentials.user_id
    where users.email=${email} and credentials.id=${authRes.id} LIMIT 1`;

    if (!credentialRow?.length) {
      throw new Error('User not found');
    }

    const credential = credentialRow[0];
    const credentialPublicKey = new Uint8Array(credential.public_key);

    const { authenticationInfo, verified } = await verifyAuthenticationResponse(
      {
        response: authRes,
        expectedChallenge: options.challenge,
        expectedOrigin: ENV.WEBAUTHN.RP_ORIGIN,
        expectedRPID: ENV.WEBAUTHN.RP_ID,
        authenticator: {
          credentialID: credential.id,
          credentialPublicKey,
          counter: credential.counter,
          transports: credential.transports,
        },
      },
    );

    if (!verified || !authenticationInfo) {
      throw new Error('Invalid authentication');
    }

    sql`UPDATE credentials SET counter=${authenticationInfo.newCounter} WHERE id=${credential.id}`;

    // TODO: move this to a separate method and create a cookies utils
    const token = await signJwt({ userId: credential.user_id });
    cookies().set('session-auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    // You can return the user data here or any other information you need
    return true;
  } catch (error) {
    console.error(error);

    // TODO: can return an error code to handle it in the UI
    throw new Error('Error logging in user');
  }
};

export default login;
