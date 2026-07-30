'use client';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function RequireAuth({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { token, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login');
    }
  }, [loading, token, router]);

  if (loading) return <p className="p-6 text-gray-500">Loading...</p>;
  if (!token) return null; // redirect chal raha hai
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <p className="p-6 text-red-600">You don&apos;t have access to this page.</p>;
  }
  return <>{children}</>;
}