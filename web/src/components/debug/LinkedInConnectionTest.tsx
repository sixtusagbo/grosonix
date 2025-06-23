"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function LinkedInConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [authTest, setAuthTest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social-accounts', {
        credentials: 'include',
      });
      const accounts = await response.json();

      console.log('Social accounts response:', accounts);

      const linkedinAccount = accounts.find((account: any) => account.platform === 'linkedin');

      setConnectionStatus({
        allAccounts: accounts,
        linkedinAccount,
        isConnected: !!linkedinAccount,
        isExpired: linkedinAccount?.expires_at ? new Date() >= new Date(linkedinAccount.expires_at) : false,
      });
    } catch (error) {
      console.error('Error checking connection:', error);
      setConnectionStatus({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const testAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social/linkedin/test-auth', {
        credentials: 'include',
      });
      const result = await response.json();

      console.log('Auth test response:', result);
      setAuthTest(result);
    } catch (error) {
      console.error('Error testing auth:', error);
      setAuthTest({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>LinkedIn Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkConnection} disabled={isLoading}>
            {isLoading ? 'Checking...' : 'Check LinkedIn Connection'}
          </Button>
          <Button onClick={testAuth} disabled={isLoading} variant="outline">
            {isLoading ? 'Testing...' : 'Test Auth'}
          </Button>
        </div>

        {connectionStatus && (
          <div className="space-y-2">
            <h3 className="font-semibold">Connection Status:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(connectionStatus, null, 2)}
            </pre>
          </div>
        )}

        {authTest && (
          <div className="space-y-2">
            <h3 className="font-semibold">Auth Test:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(authTest, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
