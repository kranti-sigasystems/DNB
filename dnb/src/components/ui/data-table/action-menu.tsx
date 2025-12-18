/**
 * Action Menu Component
 * Reusable dropdown menu for table row actions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DataTableAction } from './types';

interface ActionMenuProps<T> {
  item: T;
  actions: DataTableAction<T>[];
  className?: string;
}

export function ActionMenu<T>({ item, actions, className }: ActionMenuProps<T>) {
  const [isLoading, setIsLoading] = useState(false);

  const visibleActions = actions.filter(
    (action) => !action.hidden || !action.hidden(item)
  );

  if (visibleActions.length === 0) {
    return null;
  }

  const handleAction = async (action: DataTableAction<T>) => {
    if (action.disabled?.(item)) return;

    setIsLoading(true);
    try {
      await action.onClick(item);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className={cn("h-8 w-8 p-0", className)}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visibleActions.map((action, index) => {
          const Icon = action.icon;
          const isDisabled = action.disabled?.(item);

          return (
            <DropdownMenuItem
              key={index}
              onClick={() => handleAction(action)}
              disabled={isDisabled}
              className={cn(
                action.variant === 'destructive' && 'text-red-600 focus:text-red-600'
              )}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}