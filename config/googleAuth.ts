/**
 * Google Sign-In configuration — single source of truth.
 *
 * These IDs are duplicated in three other places and MUST stay in sync, or
 * Android sign-in fails with DEVELOPER_ERROR (code 10):
 *
 *  1. app.json → plugins → "@react-native-google-signin/google-signin"
 *  2. android/app/google-services.json (and the root google-services.json)
 *  3. The backend secret `google` → GOOGLE_WEB_CLIENT_ID, which googleLogin.ts
 *     uses as the expected `audience` when verifying the ID token.
 *
 * How Android sign-in actually resolves:
 *   Play Services matches the calling app's *package name + signing SHA-1*
 *   against an Android OAuth client, and that client must live in the SAME
 *   Google Cloud project as the webClientId requested below. If no OAuth client
 *   matches the certificate the app was signed with, signIn() throws
 *   DEVELOPER_ERROR — with no further detail from Google.
 *
 * Because Play App Signing re-signs uploads, the Play-distributed build has a
 * DIFFERENT SHA-1 than the EAS upload key. Both fingerprints must be registered.
 * See GOOGLE_SIGNIN_SETUP notes in the release checklist.
 */

/** Web (server) OAuth client — the audience of the ID token sent to our backend. */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "904573665938-8nll766e8aghsactrfrd5ucu6n4f1haa.apps.googleusercontent.com";

/**
 * The Google Cloud project number that owns GOOGLE_WEB_CLIENT_ID.
 * Kept explicit so the mismatch check below can flag a misconfigured build
 * instead of leaving it to fail as an opaque DEVELOPER_ERROR on device.
 */
export const GOOGLE_OAUTH_PROJECT_NUMBER = GOOGLE_WEB_CLIENT_ID.split("-")[0];
