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
  const [isExpanded, setIsExpanded] = useState(config.defaultExpanded || false);

  const handleInputChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleSearch = () => {
    // Remove empty values and trim strings
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value && value.trim() !== '') {
        acc[key] = value.trim();
      }
      return acc;
    }, {} as SearchFilters);

    onSearch(cleanFilters);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  const handleReset = () => {
    setFilters({});
    setIsExpanded(config.defaultExpanded || false);
    onClear();
  };

  // Handle Enter key press for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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
    <Card className={cn('mb-6', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold">{config.title}</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {config.showAdvancedToggle !== false && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2"
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
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Quick Search */}
        {config.showQuickSearch !== false && (
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder={config.quickSearchPlaceholder}
                value={filters[config.quickSearchField || 'query'] || ''}
                onChange={(e) => handleInputChange(config.quickSearchField || 'query', e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </Button>
            {hasActiveFilters && (
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
            <Button
              onClick={handleReset}
              variant="ghost"
              className="flex items-center gap-2"
            >
              Reset
            </Button>
          </div>
        )}

        {/* Advanced Filters */}
        {isExpanded && config.fields.length > 0 && (
          <>
            <Separator className="mb-4" />
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
              
              {/* Advanced Search Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSearch} 
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    {loading ? 'Searching...' : 'Search'}
                  </Button>
                  
                  {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      onClick={handleClear}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    onClick={handleReset}
                    className="flex items-center gap-2"
                  >
                    Reset All
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
          <div className="mt-4 pt-4 border-t">
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
                        onClick={() => handleInputChange(key, '')}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}