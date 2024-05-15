'use server';

import { ENV } from '@/constants/env';
import { signJwt } from '@/utils/jwt';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import {
  AuthenticatorTransportFuture,
  Base64URLString,
  CredentialDeviceType,
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { sql } from '@vercel/postgres';
import { UUID } from 'crypto';
import { cookies } from 'next/headers';

// Based on: https://simplewebauthn.dev/docs/packages/server#additional-data-structures
// TODO: extract to a types/interfaces file
/**
 * It is strongly advised that credentials get their own DB
 * table, ideally with a foreign key somewhere connecting it
 * to a specific UserModel.
 *
 * "SQL" tags below are suggestions for column data types and
 * how best to store data received during registration for use
 * in subsequent authentications.
 */
type Passkey = {
  // SQL: Store as `TEXT`. Index this column
  id: Base64URLString;
  // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
  //      Caution: Node ORM's may map this to a Buffer on retrieval,
  //      convert to Uint8Array as necessary
  publicKey: Uint8Array;
  // SQL: Foreign Key to an instance of your internal user model
  user: UUID;
  // SQL: Store as `TEXT`. Index this column. A UNIQUE constraint on
  //      (webAuthnUserID + user) also achieves maximum user privacy
  webauthnUserID: Base64URLString;
  // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
  counter: number;
  // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
  // Ex: 'singleDevice' | 'multiDevice'
  deviceType: CredentialDeviceType;
  // SQL: `BOOL` or whatever similar type is supported
  backedUp: boolean;
  // SQL: `VARCHAR(255)` and store string array as a CSV string
  // Ex: ['ble' | 'cable' | 'hybrid' | 'internal' | 'nfc' | 'smart-card' | 'usb']
  transports?: AuthenticatorTransportFuture[];
};

const verification = async ({
  auth,
  options,
  email,
}: {
  auth: RegistrationResponseJSON;
  options: PublicKeyCredentialCreationOptionsJSON;
  email: string;
}) => {
  try {
    const verification = await verifyRegistrationResponse({
      response: auth,
      expectedChallenge: options.challenge,
      expectedOrigin: ENV.WEBAUTHN.RP_ORIGIN,
      expectedRPID: ENV.WEBAUTHN.RP_ID,
    });

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      throw new Error('User verification failed');
    }

    // TODO: split into separate function
    const { rows } =
      await sql`SELECT id from USERS where email=${email} LIMIT 1`;

    if (!rows?.length) {
      throw new Error('User not found');
    }
    const userId = rows[0].id;

    const newPasskey: Passkey = {
      user: userId,
      webauthnUserID: options.user.id,
      // A unique identifier for the credential
      id: registrationInfo.credentialID,
      publicKey: registrationInfo.credentialPublicKey,
      counter: registrationInfo.counter,
      deviceType: registrationInfo.credentialDeviceType,
      backedUp: registrationInfo?.credentialBackedUp,
      transports: auth.response.transports,
    };

    // TODO: use an ORM to handle this
    await sql.query(
      `INSERT INTO credentials (
      id,
      public_key,
      user_id,
      webauthn_user_id,
      counter,
      device_type,
      backed_up,
      transports
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        newPasskey.id,
        Buffer.from(newPasskey.publicKey),
        newPasskey.user,
        newPasskey.webauthnUserID,
        newPasskey.counter,
        newPasskey.deviceType,
        newPasskey.backedUp,
        newPasskey?.transports?.join(','),
      ],
    );

    const token = await signJwt({ userId: newPasskey.user });
    cookies().set('session-auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    // You can return the user data here or any other information you need
    return true;
  } catch (error) {
    console.error(error);
    // TODO: can return an error code to handle it in the UI
    throw new Error('Error verifying user');
  }
};

export default verification;
