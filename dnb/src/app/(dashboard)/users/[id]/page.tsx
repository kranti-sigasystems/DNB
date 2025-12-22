'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, User, Mail, Phone, Building, MapPin, Calendar } from 'lucide-react';
import { getUserById } from '@/actions/users.actions';
import { getStoredSession } from '@/utils/auth';
import type { BusinessOwner, Buyer } from '@/types/users';

export default function UserDetail() {
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

  const handleBack = () => {
    router.push('/users');
  };

  const handleEdit = () => {
    router.push(`/users/${params.id}/edit`);
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

  if (!user || !userRole) {
    return null;
  }

  const isBusinessOwner = userRole === 'super_admin';
  const businessOwner = user as BusinessOwner;
  const buyer = user as Buyer;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {isBusinessOwner ? 'Business Owner Details' : 'Buyer Details'}
            </h1>
          </div>
        </div>
        <Button onClick={handleEdit} className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      </div>

      {/* User Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Name:</span>
              <span className="font-medium">{user.first_name} {user.last_name}</span>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="w-4 h-4" />
                Email:
              </span>
              <span className="font-medium">{user.email}</span>
            </div>
            
            {user.phoneNumber && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    Phone:
                  </span>
                  <span className="font-medium">{user.phoneNumber}</span>
                </div>
              </>
            )}
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created:
              </span>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              {isBusinessOwner ? 'Business Information' : 'Company Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isBusinessOwner ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Business Name:</span>
                  <span className="font-medium">{businessOwner.businessName}</span>
                </div>
                
                {businessOwner.registrationNumber && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Registration Number:</span>
                      <span className="font-medium">{businessOwner.registrationNumber}</span>
                    </div>
                  </>
                )}
                
                {businessOwner.postalCode && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Postal Code:
                      </span>
                      <span className="font-medium">{businessOwner.postalCode}</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Company Name:</span>
                  <span className="font-medium">{buyer.buyersCompanyName}</span>
                </div>
                
                {buyer.contactEmail && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        Contact Email:
                      </span>
                      <span className="font-medium">{buyer.contactEmail}</span>
                    </div>
                  </>
                )}
                
                {buyer.contactPhone && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        Contact Phone:
                      </span>
                      <span className="font-medium">{buyer.contactPhone}</span>
                    </div>
                  </>
                )}
                
                {buyer.productName && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Product Name:</span>
                      <span className="font-medium">{buyer.productName}</span>
                    </div>
                  </>
                )}
                
                {buyer.locationName && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Location:
                      </span>
                      <span className="font-medium">{buyer.locationName}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}