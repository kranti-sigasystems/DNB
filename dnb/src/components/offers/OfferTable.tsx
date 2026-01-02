'use client';

import React, { useState, useMemo } from 'react';
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
  Package, 
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Building2,
  MapPin,
  User,
  DollarSign
} from 'lucide-react';
import { useAlertDialog } from '@/components/ui/alert-dialog';
import { TableRefreshIndicator } from '@/components/ui/table-refresh-indicator';
import { cn } from '@/lib/utils';

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'offerName' | 'toParty' | 'destination' | 'grandTotal' | 'status' | 'offerValidityDate' | 'createdAt';

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

interface Offer {
  id: number;
  offerName: string;
  businessName: string;
  fromParty: string;
  toParty: string;
  destination: string;
  grandTotal: number;
  status: string;
  offerValidityDate: Date;
  createdAt: Date;
  buyer: {
    buyersCompanyName: string;
    contactName: string;
    contactEmail: string;
  } | null;
  products: any[];
}

interface OfferTableProps {
  data: Offer[];
  isLoading?: boolean;
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onView: (offerId: number) => void;
  onDelete: (offerId: number) => void;
  onAddOffer?: () => void;
  isRefreshing?: boolean;
}

const ActionMenu = ({ 
  offer, 
  onView, 
  onDelete 
}: { 
  offer: Offer;
  onView: (offerId: number) => void;
  onDelete: (offerId: number) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert, AlertDialog } = useAlertDialog();

  const handleDelete = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    showAlert({
      title: 'Delete Offer',
      description: `Are you sure you want to delete "${offer.offerName}"? This action cannot be undone.`,
      action: 'delete',
      itemName: offer.offerName,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await onDelete(offer.id);
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            disabled={isLoading}
            className="h-8 w-8 p-0 hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-48 p-1 shadow-lg border border-border/50 bg-popover/95 backdrop-blur-sm"
        >
          <DropdownMenuItem 
            onClick={() => onView(offer.id)}
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent/50 focus:bg-accent/50 rounded-sm transition-colors"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span>View Details</span>
          </DropdownMenuItem>
          
          <div className="h-px bg-border/50 my-1" />
          
          <DropdownMenuItem 
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20 rounded-sm transition-colors text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog />
    </>
  );
};

const MobileCard = ({ 
  offer, 
  onView,
  onDelete
}: { 
  offer: Offer;
  onView: (offerId: number) => void;
  onDelete: (offerId: number) => void;
}) => {
  // Check if offer is expired
  const isExpired = (validityDate: Date) => {
    return new Date(validityDate) < new Date();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { variant: 'default' as const, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      closed: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
      expired: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="mb-3 sm:mb-4 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
              {offer.offerName}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {offer.fromParty}
            </p>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {isExpired(offer.offerValidityDate) ? (
              <Badge variant="destructive">Expired</Badge>
            ) : (
              getStatusBadge(offer.status)
            )}
            <ActionMenu 
              offer={offer} 
              onView={onView}
              onDelete={onDelete}
            />
          </div>
        </div>
        
        <div className="space-y-2 text-xs sm:text-sm text-muted-foreground border-t border-border/50 pt-2 mt-2">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="font-medium">Buyer:</span>{" "}
            <span>{offer.buyer?.buyersCompanyName || offer.toParty}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span className="font-medium">Destination:</span>{" "}
            <span>{offer.destination}</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            <span className="font-medium">Value:</span>{" "}
            <span className="font-semibold text-green-600">₹{Number(offer.grandTotal || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="font-medium">Valid Until:</span>{" "}
            <span>{formatDate(offer.offerValidityDate)}</span>
          </div>
          <div>
            <span className="font-medium">Products:</span>{" "}
            <span>{offer.products?.length || 0} items</span>
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
                j === 0 ? "h-4 w-32" : // Offer name
                j === 1 ? "h-4 w-24" : // Buyer
                j === 2 ? "h-4 w-28" : // Destination
                j === 3 ? "h-4 w-20" : // Value
                j === 4 ? "h-4 w-16" : // Status
                j === 5 ? "h-4 w-24" : // Valid until
                "h-8 w-8" // Actions
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
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
              <Skeleton className="h-6 sm:h-8 w-6 sm:w-8" />
            </div>
          </div>
          <div className="border-t border-border/50 pt-2 space-y-1">
            <Skeleton className="h-3 sm:h-4 w-28 sm:w-40" />
            <Skeleton className="h-3 sm:h-4 w-24 sm:w-36" />
            <Skeleton className="h-3 sm:h-4 w-20 sm:w-32" />
            <Skeleton className="h-3 sm:h-4 w-32 sm:w-44" />
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

      <div className="flex items-center justify-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(0)}
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
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1 || isLoading}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
        >
          <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
};

export function OfferTable({
  data,
  isLoading = false,
  totalItems,
  totalPages,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onView,
  onDelete,
  onAddOffer,
  isRefreshing = false,
}: OfferTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null,
  });

  // Sort data based on sortConfig
  const sortedData = useMemo(() => {
    if (!sortConfig.field || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.field) {
        case 'offerName':
          aValue = a.offerName || '';
          bValue = b.offerName || '';
          break;
        case 'toParty':
          aValue = a.buyer?.buyersCompanyName || a.toParty || '';
          bValue = b.buyer?.buyersCompanyName || b.toParty || '';
          break;
        case 'destination':
          aValue = a.destination || '';
          bValue = b.destination || '';
          break;
        case 'grandTotal':
          aValue = Number(a.grandTotal || 0);
          bValue = Number(b.grandTotal || 0);
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'offerValidityDate':
          aValue = new Date(a.offerValidityDate).getTime();
          bValue = new Date(b.offerValidityDate).getTime();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (!aValue && !bValue) return 0;
      if (!aValue) return sortConfig.direction === 'asc' ? 1 : -1;
      if (!bValue) return sortConfig.direction === 'asc' ? -1 : 1;

      if (sortConfig.field === 'grandTotal' || sortConfig.field === 'offerValidityDate' || sortConfig.field === 'createdAt') {
        // Numeric/Date comparison
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      } else {
        // String comparison
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (aStr < bStr) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      }
    });
  }, [data, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { field: null, direction: null };
        } else {
          return { field, direction: 'asc' };
        }
      } else {
        return { field, direction: 'asc' };
      }
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    
    if (sortConfig.direction === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    } else if (sortConfig.direction === 'desc') {
      return <ArrowDown className="ml-2 h-4 w-4" />;
    } else {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
  };

  const SortableHeader = ({ 
    field, 
    children 
  }: { 
    field: SortField; 
    children: React.ReactNode;
  }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start"
    >
      {children}
      {getSortIcon(field)}
    </Button>
  );

  // Check if offer is expired
  const isExpired = (validityDate: Date) => {
    return new Date(validityDate) < new Date();
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { variant: 'default' as const, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      closed: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
      expired: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Mobile Cards */}
      <div className="lg:hidden">
        {isLoading ? (
          <MobileSkeleton />
        ) : sortedData.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {sortedData.map((offer) => (
              <MobileCard 
                key={offer.id} 
                offer={offer} 
                onView={onView}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 sm:p-12 text-center">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium text-sm sm:text-base">
              No offers found
            </p>
            <p className="text-muted-foreground/70 text-xs sm:text-sm mt-1 mb-4">
              Try adjusting your search criteria or create your first offer
            </p>
            {onAddOffer && (
              <Button onClick={onAddOffer} size="sm" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Create Offer
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Offers</CardTitle>
            <TableRefreshIndicator 
              isRefreshing={isRefreshing} 
              message="Updating offers..."
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {totalItems > 0 || isLoading ? (
            <>
              <div className="rounded-lg border border-border overflow-hidden bg-white dark:bg-gray-950">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[200px]">
                        <SortableHeader field="offerName">Offer Details</SortableHeader>
                      </TableHead>
                      <TableHead className="min-w-[150px]">
                        <SortableHeader field="toParty">Buyer</SortableHeader>
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        <SortableHeader field="destination">Destination</SortableHeader>
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        <SortableHeader field="grandTotal">Value</SortableHeader>
                      </TableHead>
                      <TableHead className="min-w-[100px]">
                        <SortableHeader field="status">Status</SortableHeader>
                      </TableHead>
                      <TableHead className="min-w-[120px]">
                        <SortableHeader field="offerValidityDate">Valid Until</SortableHeader>
                      </TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableSkeleton columnsCount={7} />
                    ) : sortedData.length > 0 ? (
                      sortedData.map((offer) => (
                        <TableRow key={offer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">{offer.offerName}</div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {offer.fromParty}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {offer.products?.length || 0} products
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {offer.buyer?.buyersCompanyName || offer.toParty}
                              </div>
                              {offer.buyer?.contactName && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {offer.buyer.contactName}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="w-3 h-3 text-muted-foreground" />
                              {offer.destination}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <div className="font-semibold text-green-600">
                              ₹{Number(offer.grandTotal || 0).toLocaleString()}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            {isExpired(offer.offerValidityDate) ? (
                              <Badge variant="destructive">Expired</Badge>
                            ) : (
                              getStatusBadge(offer.status)
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                {formatDate(offer.offerValidityDate)}
                              </div>
                              {isExpired(offer.offerValidityDate) && (
                                <div className="text-xs text-red-600 mt-1">Expired</div>
                              )}
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <ActionMenu 
                              offer={offer}
                              onView={onView}
                              onDelete={onDelete}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Package className="w-8 h-8 text-muted-foreground/50" />
                            <p className="text-muted-foreground">No offers found</p>
                            <p className="text-muted-foreground/70 text-sm mb-3">Try adjusting your search criteria or create your first offer</p>
                            {onAddOffer && (
                              <Button onClick={onAddOffer} size="sm" className="flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Create Offer
                              </Button>
                            )}
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
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Offers Found</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first offer.</p>
              {onAddOffer && (
                <Button onClick={onAddOffer} className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Create Offer
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}