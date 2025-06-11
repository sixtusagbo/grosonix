"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TwitterTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testTwitterConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/twitter-test');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        status: 'error',
        message: 'Failed to test Twitter connection',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="glass-card border-electric-purple/20">
          <CardHeader>
            <CardTitle className="text-white">Twitter API Debug Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testTwitterConnection}
              disabled={loading}
              className="bg-electric-purple hover:bg-electric-purple/80"
            >
              {loading ? 'Testing...' : 'Test Twitter Connection'}
            </Button>

            {result && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-3">Test Result:</h3>
                <pre className="bg-black/50 p-4 rounded-lg text-sm text-green-400 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
