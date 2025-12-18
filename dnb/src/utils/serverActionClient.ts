/**
 * Server Action Client - Utility for calling server actions with automatic token handling
 */

import { ensureAuthenticated } from './tokenManager';

/**
 * Call a server action with automatic token handling
 * @param serverAction The server action function to call
 * @param args Arguments to pass to the server action (excluding authToken)
 * @returns Promise with the server action result
 */
export async function callServerAction<T extends any[], R>(
  serverAction: (...args: [...T, string?]) => Promise<R>,
  ...args: T
): Promise<R> {
  try {
    const authToken = await ensureAuthenticated();
    return await serverAction(...args, authToken);
  } catch (error) {
    console.error('Server action call failed:', error);
    throw error;
  }
}

/**
 * Call a server action with optional token handling (for actions that don't require auth)
 * @param serverAction The server action function to call
 * @param args Arguments to pass to the server action (excluding authToken)
 * @returns Promise with the server action result
 */
export async function callServerActionOptional<T extends any[], R>(
  serverAction: (...args: [...T, string?]) => Promise<R>,
  ...args: T
): Promise<R> {
  try {
    const authToken = await ensureAuthenticated();
    return await serverAction(...args, authToken);
  } catch (error) {
    // If authentication fails, try without token
    console.warn('Authentication failed, trying without token:', error);
    return await serverAction(...args);
  }
}

export default callServerAction;