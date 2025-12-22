'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createTestBusinessOwner, getDatabaseStats, listAllBusinessOwners } from '@/actions/test-data.actions';

export default function TestDatabase() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [businessOwners, setBusinessOwners] = useState<any[]>([]);
  const [message, setMessage] = useState<string>('');

  const handleCreateTestData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const result = await createTestBusinessOwner();
      setMessage(result.message);
      if (result.success) {
        // Refresh stats and list
        await handleGetStats();
        await handleListBusinessOwners();
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStats = async () => {
    setLoading(true);
    try {
      const dbStats = await getDatabaseStats();
      setStats(dbStats);
    } catch (error: any) {
      setMessage(`Error fetching stats: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleListBusinessOwners = async () => {
    setLoading(true);
    try {
      const owners = await listAllBusinessOwners();
      setBusinessOwners(owners);
    } catch (error: any) {
      setMessage(`Error listing business owners: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Database Test</h1>
      </div>

      {message && (
        <Card>
          <CardContent className="pt-6">
            <p className={message.includes('Error') ? 'text-red-600' : 'text-green-600'}>
              {message}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button onClick={handleCreateTestData} disabled={loading}>
          Create Test Business Owner
        </Button>
        <Button onClick={handleGetStats} disabled={loading} variant="outline">
          Get Database Stats
        </Button>
        <Button onClick={handleListBusinessOwners} disabled={loading} variant="outline">
          List All Business Owners
        </Button>
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Database Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.users}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Business Owners</p>
                <p className="text-2xl font-bold">{stats.businessOwners}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeBusinessOwners}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inactiveBusinessOwners}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {businessOwners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Business Owners ({businessOwners.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {businessOwners.map((owner, index) => (
                <div key={owner.id} className="border rounded p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <p className="font-semibold">{owner.first_name} {owner.last_name}</p>
                      <p className="text-sm text-muted-foreground">{owner.email}</p>
                    </div>
                    <div>
                      <p className="font-medium">{owner.businessName}</p>
                      <p className="text-sm text-muted-foreground">Reg: {owner.registrationNumber}</p>
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        owner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {owner.status}
                      </span>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created: {new Date(owner.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}