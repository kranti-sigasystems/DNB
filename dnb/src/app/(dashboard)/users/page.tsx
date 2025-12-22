'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { UsersPage } from '@/components/users/UsersPage';
import { getStoredSession } from '@/utils/auth';

export default function Users() {
  const [userRole, setUserRole] = useState<'super_admin' | 'business_owner' | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();
    
    if (!session || !session.user || !session.accessToken) {
      redirect('/login');
      return;
    }

    const role = session.user.userRole as 'super_admin' | 'business_owner' | 'buyer';
    
    // Only super_admin and business_owner can access users page
    if (role !== 'super_admin' && role !== 'business_owner') {
      redirect('/dashboard');
      return;
    }

    setUserRole(role);
    setAuthToken(session.accessToken);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!userRole || !authToken) {
    return null;
  }

  return <UsersPage userRole={userRole} authToken={authToken} />;
}