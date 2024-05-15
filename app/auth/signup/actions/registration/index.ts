'use server';

import { ENV } from '@/constants/env';
import {
  GenerateRegistrationOptionsOpts,
  generateRegistrationOptions,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

import { sql } from '@vercel/postgres';

const registration = async ({ email }: { email: string }) => {
  try {
    // TODO: use an ORM to handle this
    const { rows } =
      await sql`SELECT id, email from USERS where email=${email} LIMIT 1`;

    if (rows?.length) {
      throw new Error('User already exists');
    }

    await sql`INSERT INTO USERS (email) VALUES (${email}) RETURNING id`;

    const userID = isoBase64URL.toBuffer(email, 'base64url');

    // Configure the options according to your use case
    const options: GenerateRegistrationOptionsOpts = {
      rpName: ENV.WEBAUTHN.RP_NAME,
      rpID: ENV.WEBAUTHN.RP_ID,
      userID,
      userName: email,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        // Defaults
        residentKey: 'preferred',
        userVerification: 'preferred',
        // Optional
        authenticatorAttachment: 'platform',
      },
      // Details: https://simplewebauthn.dev/docs/packages/server#domexception-notsupportederror-unrecognized-name
      supportedAlgorithmIDs: [-7, -257],
    };

    const regOptions = await generateRegistrationOptions(options);

    return regOptions;
  } catch (error) {
    console.error(error);
    // TODO: can return an error code to handle it in the UI
    throw new Error('Error registering user');
  }
};

export default registration;
