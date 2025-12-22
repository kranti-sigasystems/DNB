'use server';

/**
 * Setup buyers table through server action
 */
export async function setupBuyersTable(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    
    // Call the API route internally
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/setup-buyers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (result.success) {
      return {
        success: true,
        message: result.message
      };
    } else {
      return {
        success: false,
        message: 'Failed to setup buyers table',
        error: result.error
      };
    }
  } catch (error: any) {
    console.error('❌ setupBuyersTable - Error:', error);
    return {
      success: false,
      message: 'Failed to setup buyers table',
      error: error.message
    };
  }
}