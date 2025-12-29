'use client';

import { useState, useCallback } from 'react';
import { Search, X, ChevronDown, ChevronUp, Filter } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { UniversalSearchProps, SearchFilters } from '@/types/search';

export function UniversalSearch({
  config,
  onSearch,
  onClear,
  loading = false,
  className,
}: UniversalSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isExpanded, setIsExpanded] = useState(false); // Always start collapsed

  const handleInputChange = useCallback((name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value || undefined,
    }));
  }, []);

  const handleSearch = useCallback((e?: React.MouseEvent | React.FormEvent) => {
    // Prevent any form submission or default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Remove empty values and trim strings
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key] = value.trim();
      }
      return acc;
    }, {} as SearchFilters);

    onSearch(cleanFilters);
  }, [filters, onSearch]);

  const handleClear = useCallback((e?: React.MouseEvent | React.FormEvent) => {
    // Prevent any form submission or default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Clear filters immediately
    setFilters({});
    setIsExpanded(false);
    
    // Call onClear immediately without setTimeout
    try {
      onClear();
    } catch (error) {
      console.error('Error in onClear:', error);
    }
  }, [onClear]);

  // Handle Enter key press for search
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSearch();
    }
  }, [handleSearch]);

  const toggleExpanded = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;

  return (
    <div 
      className={cn('mb-1', className)}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
    >
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1 p-2 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-primary" />
              <h3 className="text-xs font-medium leading-none tracking-tight">{config.title}</h3>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-4 px-1">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleExpanded}
                className="flex items-center gap-1 h-7 px-2 text-xs"
                type="button"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Filters
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="px-2 pb-2">
          {/* Advanced Filters - Only show when expanded */}
          {isExpanded && config.fields.length > 0 && (
            <>
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {config.fields.map((field) => (
                    <div key={field.name} className="space-y-1">
                      <Label htmlFor={field.name} className="text-xs font-medium text-muted-foreground">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === 'select' ? (
                        <Select
                          value={filters[field.name] || ''}
                          onValueChange={(value) => handleInputChange(field.name, value)}
                        >
                          <SelectTrigger className="h-7 text-xs px-2 py-1">
                            <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={field.name}
                          type={field.type}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                          value={filters[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="h-7 text-xs px-2 py-1"
                        />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Search Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSearch} 
                      disabled={loading}
                      className="flex items-center gap-1 h-7 px-3 text-xs"
                      type="button"
                    >
                      <Search className="w-3 h-3" />
                      {loading ? 'Searching...' : 'Search'}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={handleClear}
                      className="flex items-center gap-1 h-7 px-3 text-xs"
                      type="button"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                      Clear All
                    </Button>
                  </div>
                  
                  {hasActiveFilters && (
                    <div className="text-xs text-muted-foreground">
                      {activeFilterCount} active
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className={cn("pt-2 border-t border-border/30", isExpanded ? "mt-2" : "mt-0")}>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">Active:</span>
                {Object.entries(filters)
                  .filter(([_, value]) => value && value.trim() !== '')
                  .map(([key, value]) => {
                    const field = config.fields.find(f => f.name === key);
                    const fieldLabel = field?.label || key;
                    return (
                      <Badge 
                        key={key} 
                        variant="secondary" 
                        className="flex items-center gap-1 text-xs h-4"
                      >
                        <span className="font-medium">{fieldLabel}:</span>
                        <span>{value}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleInputChange(key, '');
                          }}
                          className="ml-1 hover:text-destructive"
                          type="button"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </Badge>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}