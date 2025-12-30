'use client';

import React, { useCallback } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SizeBreakup } from '@/types/offer-draft';

interface SizeBreakupSectionProps {
  sizeBreakups: SizeBreakup[];
  onSizeBreakupChange: (index: number, field: keyof SizeBreakup, value: any) => void;
  onSizeBreakupNumericChange?: (index: number, field: 'breakup' | 'price', value: string) => void;
  onAddSizeBreakup: () => void;
  onRemoveSizeBreakup: (index: number) => void;
  productIndex?: number; // For identifying which product this belongs to
  className?: string;
}

const EMPTY_SIZE_BREAKUP: SizeBreakup = {
  size: '',
  breakup: 0,
  price: 0,
  condition: '',
  sizeDetails: '',
  breakupDetails: '',
  priceDetails: '',
  conditionDetails: '',
};

export function SizeBreakupSection({
  sizeBreakups,
  onSizeBreakupChange,
  onSizeBreakupNumericChange,
  onAddSizeBreakup,
  onRemoveSizeBreakup,
  productIndex,
  className = '',
}: SizeBreakupSectionProps) {
  
  // Handle numeric input changes with validation
  const handleNumericChange = useCallback((index: number, field: 'breakup' | 'price', value: string) => {
    if (onSizeBreakupNumericChange) {
      onSizeBreakupNumericChange(index, field, value);
    } else {
      // Fallback to original handler with validation
      if (value === '') {
        onSizeBreakupChange(index, field, 0);
        return;
      }
      
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        onSizeBreakupChange(index, field, numValue);
      }
    }
  }, [onSizeBreakupChange, onSizeBreakupNumericChange]);
  
  // Calculate total breakup amount (breakup * price)
  const calculateTotalAmount = useCallback(() => {
    return sizeBreakups.reduce((sum, breakup) => sum + ((breakup.breakup || 0) * (breakup.price || 0)), 0);
  }, [sizeBreakups]);

  // Calculate total breakup quantity
  const calculateTotalBreakup = useCallback(() => {
    return sizeBreakups.reduce((sum, breakup) => sum + (breakup.breakup || 0), 0);
  }, [sizeBreakups]);

  const totalAmount = calculateTotalAmount();
  const totalBreakup = calculateTotalBreakup();

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-card-foreground">Size Breakups</h5>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddSizeBreakup}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Size
        </Button>
      </div>
      
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full border border-border text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-3 py-3 text-left border-r border-border text-muted-foreground">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Size</div>
                    <Input
                      placeholder="Size details"
                      className="h-7 text-xs border-border/50 bg-background/50 text-muted-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      value={sizeBreakups[0]?.sizeDetails || ''}
                      onChange={(e) => {
                        // Update all breakups with the same size details
                        sizeBreakups.forEach((_, index) => {
                          onSizeBreakupChange(index, 'sizeDetails', e.target.value);
                        });
                      }}
                    />
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-border text-muted-foreground">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Condition</div>
                    <Input
                      placeholder="Condition details"
                      className="h-7 text-xs border-border/50 bg-background/50 text-muted-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      value={sizeBreakups[0]?.conditionDetails || ''}
                      onChange={(e) => {
                        // Update all breakups with the same condition details
                        sizeBreakups.forEach((_, index) => {
                          onSizeBreakupChange(index, 'conditionDetails', e.target.value);
                        });
                      }}
                    />
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-border text-muted-foreground">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Breakup</div>
                    <Input
                      placeholder="Breakup details"
                      className="h-7 text-xs border-border/50 bg-background/50 text-muted-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      value={sizeBreakups[0]?.breakupDetails || ''}
                      onChange={(e) => {
                        // Update all breakups with the same breakup details
                        sizeBreakups.forEach((_, index) => {
                          onSizeBreakupChange(index, 'breakupDetails', e.target.value);
                        });
                      }}
                    />
                  </div>
                </th>
                <th className="px-3 py-3 text-left border-r border-border text-muted-foreground">
                  <div className="space-y-2">
                    <div className="font-medium text-sm">Price</div>
                    <Input
                      placeholder="Price details"
                      className="h-7 text-xs border-border/50 bg-background/50 text-muted-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      value={sizeBreakups[0]?.priceDetails || ''}
                      onChange={(e) => {
                        // Update all breakups with the same price details
                        sizeBreakups.forEach((_, index) => {
                          onSizeBreakupChange(index, 'priceDetails', e.target.value);
                        });
                      }}
                    />
                  </div>
                </th>
                <th className="px-3 py-3 text-center text-muted-foreground">
                  <div className="font-medium text-sm">Actions</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sizeBreakups.map((breakup, breakupIndex) => (
                <tr key={breakupIndex} className="border-t border-border">
                  <td className="px-3 py-2 border-r border-border">
                    <Input
                      value={breakup.size}
                      onChange={(e) => onSizeBreakupChange(breakupIndex, 'size', e.target.value)}
                      placeholder="Size"
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2 border-r border-border">
                    <Input
                      value={breakup.condition}
                      onChange={(e) => onSizeBreakupChange(breakupIndex, 'condition', e.target.value)}
                      placeholder="Condition"
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2 border-r border-border">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={breakup.breakup || ''}
                      onChange={(e) => handleNumericChange(breakupIndex, 'breakup', e.target.value)}
                      placeholder="Breakup"
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2 border-r border-border">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={breakup.price || ''}
                      onChange={(e) => handleNumericChange(breakupIndex, 'price', e.target.value)}
                      placeholder="Price"
                      className="h-8"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSizeBreakup(breakupIndex)}
                      className="text-red-600 hover:text-red-700"
                      disabled={sizeBreakups.length === 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted">
              <tr>
                <td colSpan={3} className="px-3 py-2 font-semibold text-muted-foreground">Total Quantity:</td>
                <td className="px-3 py-2 font-semibold text-foreground">{totalBreakup}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {/* Individual size breakup items */}
        {sizeBreakups.map((breakup, breakupIndex) => (
          <div key={breakupIndex} className="border rounded p-3 bg-card">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Size</Label>
                <Input
                  value={breakup.size}
                  onChange={(e) => onSizeBreakupChange(breakupIndex, 'size', e.target.value)}
                  placeholder="Size"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-light">Size Details</Label>
                <Input
                  value={breakup.sizeDetails || ''}
                  onChange={(e) => onSizeBreakupChange(breakupIndex, 'sizeDetails', e.target.value)}
                  placeholder="Size details"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Condition</Label>
                <Input
                  value={breakup.condition}
                  onChange={(e) => onSizeBreakupChange(breakupIndex, 'condition', e.target.value)}
                  placeholder="Condition"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-light">Condition Details</Label>
                <Input
                  value={breakup.conditionDetails || ''}
                  onChange={(e) => onSizeBreakupChange(breakupIndex, 'conditionDetails', e.target.value)}
                  placeholder="Condition details"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Breakup</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={breakup.breakup || ''}
                  onChange={(e) => handleNumericChange(breakupIndex, 'breakup', e.target.value)}
                  placeholder="Breakup"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-light">Breakup Details</Label>
                <Input
                  value={breakup.breakupDetails || ''}
                  onChange={(e) => onSizeBreakupChange(breakupIndex, 'breakupDetails', e.target.value)}
                  placeholder="Breakup details"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Price</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={breakup.price || ''}
                  onChange={(e) => handleNumericChange(breakupIndex, 'price', e.target.value)}
                  placeholder="Price"
                />
              </div>
              <div className="space-y-2">
                <Label className="">Price Details</Label>
                <Input
                  value={breakup.priceDetails || ''}
                  onChange={(e) => onSizeBreakupChange(breakupIndex, 'priceDetails', e.target.value)}
                  placeholder="Price details"
                />
              </div>
            </div>
            <div className="flex justify-end mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveSizeBreakup(breakupIndex)}
                className="text-red-600 hover:text-red-700"
                disabled={sizeBreakups.length === 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        <div className="bg-muted p-3 rounded text-sm">
          <div className="font-semibold text-muted-foreground">
            Total Quantity: <span className="text-foreground">{totalBreakup}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { EMPTY_SIZE_BREAKUP };