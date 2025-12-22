'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testTokenRefresh, testTokenExpiry, debugAuthState } from '@/utils/auth-test';
import { forceRefreshToken, getValidToken } from '@/utils/tokenManager';
import { getTokenInfo } from '@/utils/token-utils';
import { getauthToken } from '@/utils/auth';

export default function TestTokenRefreshPage() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTokenRefreshTest = async () => {
    setLoading(true);
    try {
      const testResults = await testTokenRefresh();
      setResults(testResults);
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const runTokenExpiryTest = async () => {
    setLoading(true);
    try {
      const testResults = await testTokenExpiry();
      setResults(testResults);
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const runForceRefresh = async () => {
    setLoading(true);
    try {
      const newToken = await forceRefreshToken();
      setResults({ 
        success: !!newToken, 
        newToken: newToken ? 'Token refreshed successfully' : 'Failed to refresh token' 
      });
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const runGetValidToken = async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      setResults({ 
        success: !!token, 
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token'
      });
    } catch (error) {
      setResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const runDebugAuth = () => {
    debugAuthState();
    setResults({ message: 'Check console for debug output' });
  };

  const showCurrentTokenInfo = () => {
    const token = getauthToken();
    if (token) {
      const tokenInfo = getTokenInfo(token);
      setResults({
        currentTokenInfo: tokenInfo,
        message: 'Current token information displayed'
      });
    } else {
      setResults({
        message: 'No access token found'
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Token Refresh Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button 
              onClick={runTokenRefreshTest} 
              disabled={loading}
              variant="default"
            >
              {loading ? 'Testing...' : 'Test Token Refresh'}
            </Button>
            
            <Button 
              onClick={runTokenExpiryTest} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Testing...' : 'Test Token Expiry'}
            </Button>
            
            <Button 
              onClick={runForceRefresh} 
              disabled={loading}
              variant="secondary"
            >
              {loading ? 'Refreshing...' : 'Force Refresh'}
            </Button>
            
            <Button 
              onClick={runGetValidToken} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Getting...' : 'Get Valid Token'}
            </Button>
            
            <Button 
              onClick={runDebugAuth} 
              disabled={loading}
              variant="ghost"
            >
              Debug Auth State
            </Button>

            <Button 
              onClick={showCurrentTokenInfo} 
              disabled={loading}
              variant="outline"
            >
              Show Token Info
            </Button>
          </div>

          {results && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}