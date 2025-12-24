"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MoreHorizontal, 
  Users, 
  Circle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ChevronsLeft,
  ChevronsRight,
  Trash2
} from "lucide-react";
import { User, Buyer, SearchFilters } from "@/types/dashboard";
import { updateUserStatus } from "@/actions/dashboard.actions";
import { toast } from "react-hot-toast";
import { useAlertDialog } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'name' | 'email' | 'status' | 'businessName';

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

// Card action wrapper
const CardAction = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={className}>
    {children}
  </div>
);

interface DashboardTableProps {
  data: (User | Buyer)[];
  userRole: string;
  isLoading?: boolean;
  totalItems: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch?: (filters: SearchFilters) => void;
  onRefresh?: () => void;
}

interface TableItem {
  id: string;
  name: string;
  email: string;
  status: string;
  businessName: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
  item, 
  userRole, 
  onRefresh 
}: { 
  item: TableItem; 
  userRole: string; 
  onRefresh?: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert, AlertDialog } = useAlertDialog();

  const handleAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    const actionMessages = {
      activate: {
        title: 'Activate User',
        description: 'Are you sure you want to activate this user? They will be able to access the system.',
      },
      deactivate: {
        title: 'Deactivate User',
        description: 'Are you sure you want to deactivate this user? They will lose access to the system.',
      },
      delete: {
        title: 'Delete User',
        description: 'Are you sure you want to delete this user? This action cannot be undone and will permanently remove all user data.',
      },
    };

    const config = actionMessages[action];
    
    showAlert({
      title: config.title,
      description: config.description,
      action: action,
      itemName: item.name,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          // Import token manager dynamically to avoid SSR issues
          const { ensureAuthenticated } = await import('@/utils/tokenManager');
          
          // Get valid token (will refresh if needed)
          const authToken = await ensureAuthenticated();

          const result = await updateUserStatus(userRole, item.id, action, authToken);
          if (result.success) {
            toast.success(`Successfully ${action}d user`);
            onRefresh?.();
          } else {
            toast.error(result.error || `Failed to ${action} user`);
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('Authentication required')) {
            toast.error('Session expired. Please login again.');
            window.location.href = '/login';
          } else {
            toast.error(`Failed to ${action} user`);
          }
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
          {item.status !== 'active' && (
            <DropdownMenuItem 
              onClick={() => handleAction('activate')}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-green-50 focus:bg-green-50 dark:hover:bg-green-900/20 dark:focus:bg-green-900/20 rounded-sm transition-colors text-green-700 dark:text-green-400"
            >
              <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
              <span>Activate</span>
            </DropdownMenuItem>
          )}
          
          {item.status === 'active' && (
            <DropdownMenuItem 
              onClick={() => handleAction('deactivate')}
              className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-orange-50 focus:bg-orange-50 dark:hover:bg-orange-900/20 dark:focus:bg-orange-900/20 rounded-sm transition-colors text-orange-700 dark:text-orange-400"
            >
              <div className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
              </div>
              <span>Deactivate</span>
            </DropdownMenuItem>
          )}
          
          <div className="h-px bg-border/50 my-1" />
          
          <DropdownMenuItem 
            onClick={() => handleAction('delete')}
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
  item, 
  userRole, 
  onRefresh 
}: { 
  item: TableItem; 
  userRole: string; 
  onRefresh?: () => void;
}) => (
  <Card className="mb-3 sm:mb-4 hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
            {item.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
            {item.email}
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <StatusBadge status={item.status} />
          <ActionMenu item={item} userRole={userRole} onRefresh={onRefresh} />
        </div>
      </div>
      {item.businessName && (
        <div className="text-xs sm:text-sm text-muted-foreground border-t border-border/50 pt-2 mt-2">
          <span className="font-medium">Business:</span>{" "}
          <span className="truncate">{item.businessName}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const TableSkeleton = ({ columnsCount = 6 }: { columnsCount?: number }) => (
  <>
    {Array.from({ length: 8 }).map((_, i) => (
      <TableRow key={i} className="animate-pulse">
        {Array.from({ length: columnsCount }).map((_, j) => (
          <TableCell key={j} className="py-4">
            <Skeleton 
              className={cn(
                "rounded-md",
                j === 0 ? "h-4 w-4" : // Checkbox column
                j === 1 ? "h-4 w-32" : // Name column
                j === 2 ? "h-4 w-48" : // Email column
                j === 3 ? "h-6 w-20" : // Status column (badge height)
                j === 4 ? "h-4 w-36" : // Business column
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
          <div className="border-t border-border/50 pt-2">
            <Skeleton className="h-3 sm:h-4 w-28 sm:w-40" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const PaginationSkeleton = () => (
  <div className="flex items-center justify-between animate-pulse">
    <Skeleton className="h-4 w-48" />
    <div className="flex items-center space-x-2">
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
      <Skeleton className="h-8 w-8" />
    </div>
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
      // Show all pages if total is small
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination
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
        {/* Previous page (double chevron) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0 || isLoading}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
        >
          <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {/* Previous page (single chevron) */}
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

        {/* Next page (single chevron) */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1 || isLoading}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0"
        >
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {/* Next page (double chevron) */}
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

export function DashboardTable({
  data,
  userRole,
  isLoading = false,
  totalItems,
  totalPages,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onRefresh,
}: DashboardTableProps) {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [filterValue, setFilterValue] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: null,
  });

  const tableData: TableItem[] = useMemo(() => {
    
    const processed = data.map((item) => {
      // Handle name formatting based on data structure
      let name = '';
      
      if ('first_name' in item || 'last_name' in item) {
        // User data (SuperAdmin dashboard)
        const firstName = (item as any).first_name || '';
        const lastName = (item as any).last_name || '';
        name = `${firstName} ${lastName}`.trim();
        
        // If both names are empty, show email prefix or fallback
        if (!name) {
          const emailPrefix = ((item as any).email || '').split('@')[0];
          name = emailPrefix || 'Unknown User';
        }
      } else if ('contactName' in item) {
        // Buyer data (Business Owner dashboard)
        name = (item as any).contactName || '';
        
        // If contactName is empty, show email prefix or fallback
        if (!name) {
          const emailPrefix = ((item as any).contactEmail || '').split('@')[0];
          name = emailPrefix || 'Unknown Contact';
        }
      } else {
        // Fallback for unknown structure
        name = 'Unknown';
      }
      
      return {
        id: item.id,
        name: name,
        email: 'email' in item ? item.email : 'contactEmail' in item ? (item as any).contactEmail : '',
        status: item.status,
        businessName: 'businessName' in item 
          ? (item as any).businessName || ''
          : 'buyersCompanyName' in item 
          ? (item as any).buyersCompanyName || ''
          : '',
      };
    });
    
    return processed;
  }, [data, userRole]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = tableData;
    
    // Apply filter
    if (filterValue) {
      filtered = tableData.filter(item =>
        item.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        item.email.toLowerCase().includes(filterValue.toLowerCase()) ||
        item.businessName.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Apply sorting
    if (sortConfig.field && sortConfig.direction) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.field!];
        const bValue = b[sortConfig.field!];
        
        // Handle null/undefined values
        if (!aValue && !bValue) return 0;
        if (!aValue) return sortConfig.direction === 'asc' ? 1 : -1;
        if (!bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        
        // Convert to strings for comparison
        const aStr = String(aValue).toLowerCase();
        const bStr = String(bValue).toLowerCase();
        
        if (aStr < bStr) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aStr > bStr) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [tableData, filterValue, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => {
      if (prev.field === field) {
        // Same field: cycle through asc -> desc -> null
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { field: null, direction: null };
        } else {
          return { field, direction: 'asc' };
        }
      } else {
        // Different field: start with asc
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

  const userLabel = userRole === 'super_admin' ? 'Business Owners' : 'Buyers';

  return (
    <>
      {/* Mobile Cards */}
      <Card className="lg:hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-3 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">{userLabel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <Input
            placeholder="Search..."
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
            className="w-full sm:max-w-xs text-sm"
          />
          {isLoading ? (
            <MobileSkeleton />
          ) : filteredAndSortedData.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {filteredAndSortedData.map((item) => (
                <MobileCard 
                  key={item.id} 
                  item={item} 
                  userRole={userRole}
                  onRefresh={onRefresh}
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
                Try adjusting your search query
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card className="hidden lg:block">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg xl:text-xl">{userLabel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search..."
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
            className="max-w-xs"
          />
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredAndSortedData.length > 0 && filteredAndSortedData.every(item => rowSelection[item.id])}
                      onCheckedChange={(value) => {
                        const newSelection: Record<string, boolean> = {};
                        if (value) {
                          filteredAndSortedData.forEach(item => {
                            newSelection[item.id] = true;
                          });
                        }
                        setRowSelection(newSelection);
                      }}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="min-w-[150px]">
                    <SortableHeader field="name">Name</SortableHeader>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <SortableHeader field="email">Email</SortableHeader>
                  </TableHead>
                  <TableHead className="min-w-[100px]">
                    <SortableHeader field="status">Status</SortableHeader>
                  </TableHead>
                  <TableHead className="min-w-[150px]">
                    <SortableHeader field="businessName">Business</SortableHeader>
                  </TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton columnsCount={6} />
                ) : filteredAndSortedData.length > 0 ? (
                  filteredAndSortedData.map((item) => (
                    <TableRow
                      key={item.id}
                      data-state={rowSelection[item.id] && "selected"}
                      className="hover:bg-muted/50"
                    >
                      <TableCell>
                        <Checkbox
                          checked={rowSelection[item.id] || false}
                          onCheckedChange={(value) => {
                            setRowSelection(prev => ({
                              ...prev,
                              [item.id]: !!value
                            }));
                          }}
                          aria-label="Select row"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.email}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.businessName}</TableCell>
                      <TableCell>
                        <ActionMenu 
                          item={item} 
                          userRole={userRole}
                          onRefresh={onRefresh}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No results found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {isLoading ? (
            <PaginationSkeleton />
          ) : (
            <EnhancedPagination
              currentPage={pageIndex}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}