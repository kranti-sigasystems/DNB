import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { checkUniqueField } from "@/actions/business-owner";

/* ---------------------------------------------
 * Types
 * --------------------------------------------*/

type UniqueFieldKey = string;

interface UniqueCheckResult {
  exists: boolean;
  message?: string;
}

/* ---------------------------------------------
 * Hook - Now uses server actions directly
 * --------------------------------------------*/

export function useCheckUniqueFieldQuery<T extends UniqueFieldKey>(
  field?: T,
  value?: string
): UseQueryResult<UniqueCheckResult | null> {
  const trimmedValue = value?.trim();

  return useQuery<UniqueCheckResult | null>({
    queryKey: ["unique-field", field, trimmedValue],
    queryFn: async () => {
      if (!field || !trimmedValue) return null;

      try {
        // Use server action directly
        const result = await checkUniqueField(field, trimmedValue);
        
        return {
          exists: result.exists,
          message: result.message
        };
      } catch (error) {
        console.error(`Error checking ${field} uniqueness:`, error);
        return { exists: false };
      }
    },
    enabled: Boolean(field && trimmedValue),
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
