'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MoreHorizontal, 
  Users, 
  Circle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserSearch } from './UserSearch';
import type { BusinessOwner, Buyer, SearchFilters, SearchField } from '@/types/users';

interface UsersTableProps {
  data: (BusinessOwner | Buyer)[];
  userRole: 'super_admin' | 'business_owner';
  isLoading?: boolean;
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onActivate: (userId: string) => void;
  onDeactivate: (userId: string) => void;
  onDelete: (userId: string) => void;
  onRefresh: () => void;
  // Search props
  searchFields?: SearchField[];
  onSearch?: (filters: SearchFilters) => void;
  onClearSearch?: () => void;
  searchLoading?: boolean;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <Badge variant="outline" className={getStatusColor(status)}>
      <Circle className="w-2 h-2 mr-1 fill-current" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const ActionMenu = ({ 
  user, 
  onActivate, 
  onDeactivate, 
  onDelete 
}: { 
  user: BusinessOwner | Buyer;
  onActivate: (userId: string) => void;
  onDeactivate: (userId: string) => void;
  onDelete: (userId: string) => void;
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    setIsLoading(true);
    try {
      if (action === 'activate') {
        await onActivate(user.id);
      } else if (action === 'deactivate') {
        await onDeactivate(user.id);
      } else if (action === 'delete') {
        await onDelete(user.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isLoading}>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/users/${user.id}`)}>
          <Eye className="w-4 h-4 mr-2" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/users/${user.id}/edit`)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        {user.status !== 'active' && (
          <DropdownMenuItem onClick={() => handleAction('activate')}>
            Activate
          </DropdownMenuItem>
        )}
        {user.status === 'active' && (
          <DropdownMenuItem onClick={() => handleAction('deactivate')}>
            Deactivate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          onClick={() => handleAction('delete')}
          className="text-red-600 dark:text-red-400"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const MobileCard = ({ 
  user, 
  userRole,
  onActivate,
  onDeactivate,
  onDelete
}: { 
  user: BusinessOwner | Buyer;
  userRole: 'super_admin' | 'business_owner';
  onActivate: (userId: string) => void;
  onDeactivate: (userId: string) => void;
  onDelete: (userId: string) => void;
}) => {
  const getName = () => {
    if (userRole === 'super_admin') {
      const businessOwner = user as BusinessOwner;
      return `${businessOwner.first_name || ''} ${businessOwner.last_name || ''}`.trim() || 'Unknown';
    } else {
      const buyer = user as Buyer;
      return buyer.buyersCompanyName || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() || 'Unknown';
    }
  };

  const getEmail = () => {
    if (userRole === 'super_admin') {
      return user.email;
    } else {
      const buyer = user as Buyer;
      return buyer.contactEmail || user.email;
    }
  };

  return (
    <Card className="mb-3 sm:mb-4 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
              {getName()}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
              {getEmail()}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <StatusBadge status={user.status} />
            <ActionMenu 
              user={user} 
              onActivate={onActivate}
              onDeactivate={onDeactivate}
              onDelete={onDelete}
            />
          </div>
        </div>
        
        {/* Additional info based on user role */}
        <div className="space-y-2 text-xs sm:text-sm text-muted-foreground border-t border-border/50 pt-2 mt-2">
          {userRole === 'super_admin' ? (
            <>
              <div>
                <span className="font-medium">Business:</span>{" "}
                <span>{(user as BusinessOwner).businessName || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Phone:</span>{" "}
                <span>{user.phoneNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Registration:</span>{" "}
                <span>{(user as BusinessOwner).registrationNumber || 'N/A'}</span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="font-medium">Product:</span>{" "}
                <span>{(user as Buyer).productName || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Location:</span>{" "}
                <span>{(user as Buyer).locationName || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Contact:</span>{" "}
                <span>{(user as Buyer).contactPhone || 'N/A'}</span>
              </div>
            </>
          )}
          <div>
            <span className="font-medium">Created:</span>{" "}
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TableSkeleton = ({ columnsCount = 7 }: { columnsCount?: number }) => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <TableRow key={i} className="animate-pulse">
        {Array.from({ length: columnsCount }).map((_, j) => (
          <TableCell key={j} className="py-4">
            <Skeleton 
              className={cn(
                "rounded-md",
                j === 0 ? "h-4 w-32" : // Name column
                j === 1 ? "h-4 w-48" : // Email column
                j === 2 ? "h-6 w-20" : // Status column (badge height)
                j === 3 ? "h-4 w-36" : // Business/Product column
                j === 4 ? "h-4 w-24" : // Phone/Location column
                j === 5 ? "h-4 w-20" : // Created column
                "h-8 w-8" // Actions column (button height)
              )} 
            />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

const MobileSkeleton = () => (
  <div className="space-y-3 sm:space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 space-y-2 pr-2">
              <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
              <Skeleton className="h-3 sm:h-4 w-32 sm:w-48" />
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <Skeleton className="h-5 sm:h-6 w-12 sm:w-16" />
              <Skeleton className="h-6 sm:h-8 w-6 sm:w-8" />
            </div>
          </div>
          <div className="border-t border-border/50 pt-2 space-y-1">
            <Skeleton className="h-3 sm:h-4 w-28 sm:w-40" />
            <Skeleton className="h-3 sm:h-4 w-24 sm:w-36" />
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-32" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

interface EnhancedPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
}

const EnhancedPagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false
}: EnhancedPaginationProps) => {
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(0, currentPage - 2);
      const end = Math.min(totalPages - 1, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Items info and page size selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {totalItems} entries
        </p>
        
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-14 sm:w-16 h-7 sm:h-8 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">per page</span>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-center gap-1">
        {/* Previous page buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || isLoading}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
        >
          <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || isLoading}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-2">
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              disabled={isLoading}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs sm:text-sm transition-all duration-200",
                currentPage === pageNum && "bg-primary text-primary-foreground"
              )}
            >
              {pageNum + 1}
            </Button>
          ))}
        </div>

        {/* Next page buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || isLoading}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
        >
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || isLoading}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
        >
          <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
};

export function UsersTable({
  data,
  userRole,
  isLoading = false,
  totalItems,
  totalPages,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onActivate,
  onDeactivate,
  onDelete,
  onRefresh,
  // Search props
  searchFields = [],
  onSearch,
  onClearSearch,
  searchLoading = false,
}: UsersTableProps) {
  const userLabel = userRole === 'super_admin' ? 'Business Owners' : 'Buyers';

  return (
    <>
      {/* Mobile Cards */}
      <div className="lg:hidden">
        {isLoading ? (
          <MobileSkeleton />
        ) : data.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {data.map((user) => (
              <MobileCard 
                key={user.id} 
                user={user} 
                userRole={userRole}
                onActivate={onActivate}
                onDeactivate={onDeactivate}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center">
            <Users className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium text-sm sm:text-base">
              No {userLabel.toLowerCase()} found
            </p>
            <p className="text-muted-foreground/70 text-xs sm:text-sm mt-1">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">{userLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {/* Integrated Search */}
          {searchFields.length > 0 && onSearch && onClearSearch && (
            <div className="mb-6">
              <UserSearch
                searchFields={searchFields}
                onSearch={onSearch}
                onClear={onClearSearch}
                loading={searchLoading}
              />
            </div>
          )}

          {/* Empty state for business owners with no buyers */}
          {userRole === 'business_owner' && totalItems === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="space-y-4">
                <div className="text-muted-foreground">
                  <h3 className="text-lg font-semibold mb-2">No Buyers Found</h3>
                  <p className="text-sm">
                    {data?.length === 0 ? 
                      "The buyers table needs to be set up in your database." :
                      "You don't have any buyers yet."
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    To set up the buyers table, run this command in your terminal:
                  </p>
                  <code className="block bg-muted p-2 rounded text-xs">
                    node setup-buyers-table.js
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {(totalItems > 0 || isLoading) && (
            <>
              <div className="rounded-lg border border-border overflow-hidden bg-white dark:bg-gray-950">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[200px]">Email</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      {userRole === 'super_admin' ? (
                        <>
                          <TableHead className="min-w-[150px]">Business Name</TableHead>
                          <TableHead className="min-w-[120px]">Phone</TableHead>
                          <TableHead className="min-w-[120px]">Registration</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="min-w-[150px]">Product</TableHead>
                          <TableHead className="min-w-[120px]">Location</TableHead>
                          <TableHead className="min-w-[120px]">Contact Phone</TableHead>
                        </>
                      )}
                      <TableHead className="min-w-[100px]">Created</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton columnsCount={userRole === 'super_admin' ? 8 : 8} />
                    ) : data.length > 0 ? (
                      data.map((user) => {
                        const getName = () => {
                          if (userRole === 'super_admin') {
                            const businessOwner = user as BusinessOwner;
                            return `${businessOwner.first_name || ''} ${businessOwner.last_name || ''}`.trim() || 'Unknown';
                          } else {
                            const buyer = user as Buyer;
                            return buyer.buyersCompanyName || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim() || 'Unknown';
                          }
                        };

                        const getEmail = () => {
                          if (userRole === 'super_admin') {
                            return user.email;
                          } else {
                            const buyer = user as Buyer;
                            return buyer.contactEmail || user.email;
                          }
                        };

                        return (
                          <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                            <TableCell className="font-medium">{getName()}</TableCell>
                            <TableCell className="text-muted-foreground">{getEmail()}</TableCell>
                            <TableCell>
                              <StatusBadge status={user.status} />
                            </TableCell>
                            {userRole === 'super_admin' ? (
                              <>
                                <TableCell className="text-muted-foreground">
                                  {(user as BusinessOwner).businessName || 'N/A'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {user.phoneNumber || 'N/A'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {(user as BusinessOwner).registrationNumber || 'N/A'}
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell className="text-muted-foreground">
                                  {(user as Buyer).productName || 'N/A'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {(user as Buyer).locationName || 'N/A'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {(user as Buyer).contactPhone || 'N/A'}
                                </TableCell>
                              </>
                            )}
                            <TableCell className="text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <ActionMenu 
                                user={user}
                                onActivate={onActivate}
                                onDeactivate={onDeactivate}
                                onDelete={onDelete}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="w-8 h-8 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No {userLabel.toLowerCase()} found</p>
                            <p className="text-muted-foreground/70 text-sm">Try adjusting your search criteria</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="mt-6">
                <EnhancedPagination
                  currentPage={pageIndex}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={onPageChange}
                  onPageSizeChange={onPageSizeChange}
                  isLoading={isLoading}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}