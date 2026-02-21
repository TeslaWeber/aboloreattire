import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch {
          setIsSupported(false);
        }
      }
    };
    check();
  }, []);

  const register = async (accessToken: string): Promise<{ success: boolean; error?: string }> => {
    setIsRegistering(true);
    try {
      // Get challenge from server
      const { data: challengeData, error: challengeError } = await supabase.functions.invoke(
        "webauthn-register",
        {
          body: { action: "challenge" },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (challengeError || challengeData?.error) {
        return { success: false, error: challengeData?.error || "Failed to get challenge" };
      }

      const { challenge, user_id, user_email, exclude_credentials } = challengeData;

      // Create credential
      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge: base64ToArrayBuffer(challenge),
          rp: { name: "Abolore Couture", id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(user_id),
            name: user_email,
            displayName: user_email,
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },   // ES256
            { alg: -257, type: "public-key" },  // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
          excludeCredentials: exclude_credentials.map((id: string) => ({
            id: base64ToArrayBuffer(id),
            type: "public-key" as const,
          })),
        },
      })) as PublicKeyCredential;

      if (!credential) {
        return { success: false, error: "Credential creation cancelled" };
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialId = arrayBufferToBase64(credential.rawId);
      const publicKey = arrayBufferToBase64(response.getPublicKey()!);

      // Register on server
      const { data: registerData, error: registerError } = await supabase.functions.invoke(
        "webauthn-register",
        {
          body: {
            action: "register",
            credential_id: credentialId,
            public_key: publicKey,
            device_name: navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")
              ? "iPhone/iPad"
              : navigator.userAgent.includes("Android")
              ? "Android Device"
              : "Device",
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (registerError || registerData?.error) {
        return { success: false, error: registerData?.error || "Registration failed" };
      }

      return { success: true };
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        return { success: false, error: "Biometric authentication was cancelled" };
      }
      return { success: false, error: err.message || "Registration failed" };
    } finally {
      setIsRegistering(false);
    }
  };

  const authenticate = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsAuthenticating(true);
    try {
      // Get challenge
      const { data: challengeData, error: challengeError } = await supabase.functions.invoke(
        "webauthn-authenticate",
        { body: { action: "challenge", email } }
      );

      if (challengeError || challengeData?.error) {
        return { success: false, error: challengeData?.error || "Failed to get challenge" };
      }

      const { challenge, credential_ids } = challengeData;

      // Get credential
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge: base64ToArrayBuffer(challenge),
          rpId: window.location.hostname,
          allowCredentials: credential_ids.map((id: string) => ({
            id: base64ToArrayBuffer(id),
            type: "public-key" as const,
          })),
          userVerification: "required",
          timeout: 60000,
        },
      })) as PublicKeyCredential;

      if (!assertion) {
        return { success: false, error: "Authentication cancelled" };
      }

      const credentialId = arrayBufferToBase64(assertion.rawId);

      // Verify on server and get session
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        "webauthn-authenticate",
        { body: { action: "verify", credential_id: credentialId, email } }
      );

      if (verifyError || verifyData?.error) {
        return { success: false, error: verifyData?.error || "Verification failed" };
      }

      // Set the session
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: verifyData.access_token,
        refresh_token: verifyData.refresh_token,
      });

      if (sessionError) {
        return { success: false, error: "Failed to establish session" };
      }

      return { success: true };
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        return { success: false, error: "Biometric authentication was cancelled" };
      }
      return { success: false, error: err.message || "Authentication failed" };
    } finally {
      setIsAuthenticating(false);
    }
  };

  return { isSupported, isRegistering, isAuthenticating, register, authenticate };
}
