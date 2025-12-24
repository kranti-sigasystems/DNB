'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Calendar,
  UserCircle2,
  Package,
  MapPinIcon
} from 'lucide-react';
import { getUserById } from '@/actions/users.actions';
import { getStoredSession } from '@/utils/auth';
import type { BusinessOwner, Buyer } from '@/types/users';

interface ViewBuyerPageProps {
  params: Promise<{ id: string }>;
}

export default function ViewBuyerPage({ params }: ViewBuyerPageProps) {
  const { id } = use(params);
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
  }, [id]);

  const fetchUser = async (role: 'super_admin' | 'business_owner', token: string) => {
    try {
      const userData = await getUserById(role, id as string, token);
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
    router.push(`/users/${id}/edit`);
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
    <div className="relative min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background border-b border-border shadow-sm z-20 rounded-xl mb-6">
        <div className="py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-3 ml-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  {isBusinessOwner ? 'Business Owner Details' : 'Buyer Details'}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  View {isBusinessOwner ? 'business owner' : 'buyer'} information
                </p>
              </div>
            </div>
          </div>
          <Button onClick={handleEdit} className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-6">
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-6">
              {/* Company Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Building2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Company Information</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {isBusinessOwner ? 'Business details and registration' : 'Company details and registration'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {isBusinessOwner ? 'Business Name' : 'Company Name'}
                      </label>
                      <div className="p-3 bg-muted/50 rounded-md border">
                        <span className="font-medium">
                          {isBusinessOwner ? businessOwner.businessName : buyer.buyersCompanyName}
                        </span>
                      </div>
                    </div>

                    {(isBusinessOwner ? businessOwner.registrationNumber : buyer.registrationNumber) && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Registration Number
                        </label>
                        <div className="p-3 bg-muted/50 rounded-md border">
                          <span className="font-medium">
                            {isBusinessOwner ? businessOwner.registrationNumber : buyer.registrationNumber}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Status
                      </label>
                      <div className="p-3 bg-muted/50 rounded-md border">
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Created Date
                      </label>
                      <div className="p-3 bg-muted/50 rounded-md border">
                        <span className="font-medium">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <UserCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Contact Information</CardTitle>
                      <p className="text-sm text-muted-foreground">Primary contact details for communication</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Contact Name
                      </label>
                      <div className="p-3 bg-muted/50 rounded-md border">
                        <span className="font-medium">
                          {isBusinessOwner 
                            ? `${businessOwner.first_name || ''} ${businessOwner.last_name || ''}`.trim() 
                            : buyer.contactName
                          }
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </label>
                      <div className="p-3 bg-muted/50 rounded-md border">
                        <span className="font-medium">{user.email}</span>
                      </div>
                    </div>

                    {user.phoneNumber && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </label>
                        <div className="p-3 bg-muted/50 rounded-md border">
                          <span className="font-medium">{user.phoneNumber}</span>
                        </div>
                      </div>
                    )}

                    {!isBusinessOwner && buyer.contactEmail && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          Contact Email
                        </label>
                        <div className="p-3 bg-muted/50 rounded-md border">
                          <span className="font-medium">{buyer.contactEmail}</span>
                        </div>
                      </div>
                    )}

                    {!isBusinessOwner && buyer.contactPhone && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          Contact Phone
                        </label>
                        <div className="p-3 bg-muted/50 rounded-md border">
                          <span className="font-medium">{buyer.contactPhone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Product Selection (for buyers only) */}
              {!isBusinessOwner && buyer.productName && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle>Product Selection</CardTitle>
                        <p className="text-sm text-muted-foreground">Associated product information</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Selected Product
                      </label>
                      <div className="p-3 bg-muted/50 rounded-md border">
                        <span className="font-medium">{buyer.productName}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location Selection (for buyers only) */}
              {!isBusinessOwner && buyer.locationName && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <MapPinIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle>Location Selection</CardTitle>
                        <p className="text-sm text-muted-foreground">Associated location information</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Selected Location
                      </label>
                      <div className="p-3 bg-muted/50 rounded-md border">
                        <span className="font-medium">{buyer.locationName}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Address Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Address Details</CardTitle>
                      <p className="text-sm text-muted-foreground">Complete address information</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {user.city && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          City
                        </label>
                        <div className="p-3 bg-muted/50 rounded-md border">
                          <span className="font-medium">{user.city}</span>
                        </div>
                      </div>
                    )}

                    {user.state && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          State/Province
                        </label>
                        <div className="p-3 bg-muted/50 rounded-md border">
                          <span className="font-medium">{user.state}</span>
                        </div>
                      </div>
                    )}

                    {user.country && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Country
                        </label>
                        <div className="p-3 bg-muted/50 rounded-md border">
                          <span className="font-medium">{user.country}</span>
                        </div>
                      </div>
                    )}

                    {(isBusinessOwner ? businessOwner.postalCode : buyer.postalCode) && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Postal Code
                        </label>
                        <div className="p-3 bg-muted/50 rounded-md border">
                          <span className="font-medium">
                            {isBusinessOwner ? businessOwner.postalCode : buyer.postalCode}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {user.address && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Street Address
                      </label>
                      <div className="p-3 bg-muted/50 rounded-md border min-h-[100px]">
                        <span className="font-medium whitespace-pre-wrap">{user.address}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}