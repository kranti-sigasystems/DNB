"use client";

import { useState } from "react";
import { checkUniqueField } from "@/actions/business-owner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestActionsPage() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testUniqueCheck = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const result = await checkUniqueField("email", email);
      setResult(result);
      console.log("Unique check result:", result);
    } catch (error) {
      console.error("Error:", error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Server Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Test Email Uniqueness
              </label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to test"
                  className="flex-1"
                />
                <Button 
                  onClick={testUniqueCheck}
                  disabled={loading || !email}
                >
                  {loading ? "Checking..." : "Check"}
                </Button>
              </div>
            </div>

            {result && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm">
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