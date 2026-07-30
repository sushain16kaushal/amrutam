'use client';
import Script from 'next/script';
import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
  }
}

export default function GoogleSignInButton({ onCredential }: { onCredential: (idToken: string) => void }) {
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleCredentialResponse = useCallback((response: { credential: string }) => {
    onCredential(response.credential);
  }, [onCredential]);

  const initializeGoogle = useCallback(() => {
    if (!window.google || !buttonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 320
    });
  }, [handleCredentialResponse]);

  useEffect(() => {
    if (window.google) initializeGoogle();
  }, [initializeGoogle]);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogle}
      />
      <div ref={buttonRef} className="flex justify-center" />
    </>
  );
}