'use server';

import { ENV } from '@/constants/env';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { sql } from '@vercel/postgres';

const verification = async ({ email }: { email: string }) => {
  try {
    // TODO: use an ORM to handle this
    const { rows: userPasskeys } =
      await sql`SELECT credentials.id, credentials.transports
        FROM users
        LEFT JOIN credentials on users.id = credentials.user_id
        WHERE users.email=${email}`;

    if (!userPasskeys?.length) {
      throw new Error('User not found');
    }

    const options = await generateAuthenticationOptions({
      rpID: ENV.WEBAUTHN.RP_ID,
      // Require users to use a previously-registered authenticator
      allowCredentials: userPasskeys.map((passkey) => ({
        id: passkey.id,
        transports: passkey.transports.split(','),
      })),
    });

    return options;
  } catch (error) {
    console.error(error);
    // TODO: can return an error code to handle it in the UI
    throw new Error('Error generating authentication options');
  }
};

export default verification;
