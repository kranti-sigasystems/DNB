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
          className={cn(
            "h-8 w-8 p-0 hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring", 
            className
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="w-48 p-1 shadow-lg border border-border/50 bg-popover/95 backdrop-blur-sm"
      >
        {visibleActions.map((action, index) => {
          const Icon = action.icon;
          const isDisabled = action.disabled?.(item);
          const isDestructive = action.variant === 'destructive';
          const isActivate = action.label.toLowerCase().includes('activate');
          const isDeactivate = action.label.toLowerCase().includes('deactivate');
          
          // Check if we need a separator before this action
          const needsSeparator = isDestructive && index > 0 && 
            visibleActions[index - 1]?.variant !== 'destructive';

          return (
            <div key={index}>
              {needsSeparator && <div className="h-px bg-border/50 my-1" />}
              <DropdownMenuItem
                onClick={() => handleAction(action)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-sm transition-colors",
                  isDestructive && "hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-900/20 dark:focus:bg-red-900/20 text-red-600 dark:text-red-400",
                  isActivate && "hover:bg-green-50 focus:bg-green-50 dark:hover:bg-green-900/20 dark:focus:bg-green-900/20 text-green-700 dark:text-green-400",
                  isDeactivate && "hover:bg-orange-50 focus:bg-orange-50 dark:hover:bg-orange-900/20 dark:focus:bg-orange-900/20 text-orange-700 dark:text-orange-400",
                  !isDestructive && !isActivate && !isDeactivate && "hover:bg-accent/50 focus:bg-accent/50"
                )}
              >
                {Icon && (
                  <>
                    {isActivate ? (
                      <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    ) : isDeactivate ? (
                      <div className="w-4 h-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                      </div>
                    ) : (
                      <Icon className={cn(
                        "w-4 h-4",
                        !isDestructive && !isActivate && !isDeactivate && "text-muted-foreground"
                      )} />
                    )}
                  </>
                )}
                <span>{action.label}</span>
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}