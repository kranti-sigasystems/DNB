'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { UserForm } from '@/components/users/UserForm';
import { getUserById } from '@/actions/users.actions';
import { getStoredSession } from '@/utils/auth';
import type { BusinessOwner, Buyer } from '@/types/users';

export default function EditUser() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<BusinessOwner | Buyer | null>(null);
  const [userRole, setUserRole] = useState<'super_admin' | 'business_owner' | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();
    
    if (!session || !session.user || !session.accessToken) {
      router.push('/login');
      return;
    }

    const role = session.user.userRole as 'super_admin' | 'business_owner' | 'buyer';
    
    if (role !== 'super_admin' && role !== 'business_owner') {
      router.push('/dashboard');
      return;
    }

    setUserRole(role);
    setAuthToken(session.accessToken);
    
    // Fetch user data
    fetchUser(role, session.accessToken);
  }, [params.id]);

  const fetchUser = async (role: 'super_admin' | 'business_owner', token: string) => {
    try {
      const userData = await getUserById(role, params.id as string, token);
      setUser(userData);
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      toast.error(error.message || 'Failed to fetch user');
      router.push('/users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user || !userRole || !authToken) {
    return null;
  }

  return (
    <UserForm 
      userRole={userRole} 
      authToken={authToken} 
      initialData={user}
      mode="edit"
    />
  );
}