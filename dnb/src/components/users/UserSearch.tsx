'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
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
import type { SearchFilters, SearchField } from '@/types/users';

interface UserSearchProps {
  searchFields: SearchField[];
  onSearch: (filters: SearchFilters) => void;
  onClear: () => void;
  loading?: boolean;
}

export function UserSearch({ searchFields, onSearch, onClear, loading }: UserSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInputChange = (name: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({});
    onClear();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Search Users</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Search className="w-4 h-4 mr-2" />
            {isExpanded ? 'Hide' : 'Show'} Search
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {searchFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>{field.label}</Label>
                {field.type === 'select' ? (
                  <Select
                    value={filters[field.name] || ''}
                    onValueChange={(value) => handleInputChange(field.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${field.label}`} />
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
                    placeholder={field.placeholder}
                    value={filters[field.name] || ''}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
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
                variant="outline" 
                onClick={handleClear}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>
          
          {hasActiveFilters && (
            <div className="mt-3 text-sm text-muted-foreground">
              Active filters: {Object.entries(filters)
                .filter(([_, value]) => value)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ')}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}