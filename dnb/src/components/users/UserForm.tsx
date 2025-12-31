'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, User } from 'lucide-react';
import { createUser, updateUser } from '@/actions/users.actions';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import type { BusinessOwner, Buyer } from '@/types/users';

interface UserFormProps {
  userRole: 'super_admin' | 'business_owner';
  authToken: string;
  initialData?: BusinessOwner | Buyer;
  mode: 'create' | 'edit';
}

type FormData = {
  // Common fields from User interface
  id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  address?: string;
  status?: 'active' | 'inactive';
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  userRole?: 'super_admin' | 'business_owner' | 'buyer';
  
  // BusinessOwner specific fields
  businessName?: string;
  registrationNumber?: string;
  postalCode?: string;
  userId?: string;
  
  // Buyer specific fields
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  buyersCompanyName?: string;
  productName?: string;
  locationName?: string;
  businessOwnerId?: string;
};

export function UserForm({ userRole, authToken, initialData, mode }: UserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { showAlert, AlertDialog } = useAlertDialog();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: initialData || {},
  });

  const watchedStatus = watch('status');

  const onSubmit = async (data: FormData) => {
    const actionTitle = mode === 'create' ? 'Create User' : 'Update User';
    const actionDescription = mode === 'create' 
      ? `Are you sure you want to create this ${userRole === 'super_admin' ? 'business owner' : 'buyer'}?`
      : `Are you sure you want to update this ${userRole === 'super_admin' ? 'business owner' : 'buyer'}?`;
    
    const userName = mode === 'create' 
      ? `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'New User'
      : `${initialData?.first_name || ''} ${initialData?.last_name || ''}`.trim() || 'User';

    showAlert({
      title: actionTitle,
      description: actionDescription,
      action: mode === 'create' ? 'add' : 'update',
      itemName: userName,
      onConfirm: async () => {
        try {
          setLoading(true);

          if (mode === 'create') {
            await createUser(userRole, data, authToken);
            toast.success(`${userRole === 'super_admin' ? 'Business Owner' : 'Buyer'} created successfully`);
          } else if (initialData?.id) {
            await updateUser(userRole, initialData.id, data, authToken);
            toast.success(`${userRole === 'super_admin' ? 'Business Owner' : 'Buyer'} updated successfully`);
          }

          router.push('/users');
        } catch (error) {
          console.error('Form submission error:', error);
          toast.error(`Failed to ${mode} user. Please try again.`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleBack = () => {
    router.push('/users');
  };

  const pageTitle = mode === 'create' 
    ? `Add ${userRole === 'super_admin' ? 'Business Owner' : 'Buyer'}`
    : `Edit ${userRole === 'super_admin' ? 'Business Owner' : 'Buyer'}`;

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  {...register('first_name', { required: 'First name is required' })}
                  placeholder="Enter first name"
                />
                {errors.first_name && (
                  <p className="text-sm text-destructive">{errors.first_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  {...register('last_name', { required: 'Last name is required' })}
                  placeholder="Enter last name"
                />
                {errors.last_name && (
                  <p className="text-sm text-destructive">{errors.last_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  {...register('phoneNumber')}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={watchedStatus || 'active'}
                  onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-specific fields */}
        {userRole === 'super_admin' && (
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    {...register('businessName', { required: 'Business name is required' })}
                    placeholder="Enter business name"
                  />
                  {errors.businessName && (
                    <p className="text-sm text-destructive">{errors.businessName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    {...register('registrationNumber')}
                    placeholder="Enter registration number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    {...register('postalCode')}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {userRole === 'business_owner' && (
          <Card>
            <CardHeader>
              <CardTitle>Buyer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buyersCompanyName">Company Name *</Label>
                  <Input
                    id="buyersCompanyName"
                    {...register('buyersCompanyName', { required: 'Company name is required' })}
                    placeholder="Enter company name"
                  />
                  {errors.buyersCompanyName && (
                    <p className="text-sm text-destructive">{errors.buyersCompanyName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    {...register('contactEmail')}
                    placeholder="Enter contact email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    {...register('contactPhone')}
                    placeholder="Enter contact phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    {...register('productName')}
                    placeholder="Enter product name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationName">Location Name</Label>
                  <Input
                    id="locationName"
                    {...register('locationName')}
                    placeholder="Enter location name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Separator />

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </div>
      </form>
      <AlertDialog />
    </div>
  );
}