'use client';

import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

  const handleInputChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleSearch = (e?: React.MouseEvent) => {
    // Prevent default form submission behavior
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
  };

  const handleClear = (e?: React.MouseEvent) => {
    // Prevent default form submission behavior and page refresh
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setFilters({});
    setIsExpanded(false); // Also collapse the filters when clearing
    // Call onClear without causing page refresh
    onClear();
  };

  // Handle Enter key press for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSearch();
    }
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== ''
  ).length;

  return (
    <div className={cn('mb-6', className)}>
      <div> {/* Changed from Card to div to prevent form context */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold leading-none tracking-tight">{config.title}</h3>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount} active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="flex items-center gap-2"
                  type="button"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Filters
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show Filters
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-6 pt-0">
            {/* Advanced Filters - Only show when expanded */}
            {isExpanded && config.fields.length > 0 && (
              <>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {config.fields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name} className="text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {field.type === 'select' ? (
                          <Select
                            value={filters[field.name] || ''}
                            onValueChange={(value) => handleInputChange(field.name, value)}
                          >
                            <SelectTrigger>
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
                            onKeyPress={handleKeyPress}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Search Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSearch} 
                        disabled={loading}
                        className="flex items-center gap-2"
                        type="button"
                      >
                        <Search className="w-4 h-4" />
                        {loading ? 'Searching...' : 'Search'}
                      </Button>
                      
                        <Button 
                          variant="outline" 
                          onClick={handleClear}
                          className="flex items-center gap-2"
                          type="button"
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                          Clear All
                        </Button>
                    </div>
                    
                    {hasActiveFilters && (
                      <div className="text-sm text-muted-foreground">
                        {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className={cn("pt-4 border-t", isExpanded ? "mt-4" : "mt-0")}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                  {Object.entries(filters)
                    .filter(([_, value]) => value && value.trim() !== '')
                    .map(([key, value]) => {
                      const field = config.fields.find(f => f.name === key);
                      const fieldLabel = field?.label || key;
                      return (
                        <Badge 
                          key={key} 
                          variant="secondary" 
                          className="flex items-center gap-1"
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
                            <X className="w-3 h-3" />
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
    </div>
  );
}