import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useBackend } from '../hooks/useBackend';
import { Loader2, Wallet, TrendingUp, Calendar } from 'lucide-react';

export function BalanceInsights() {
  const [environment, setEnvironment] = useState<'sandbox' | 'live'>('sandbox');
  const [lookbackDays, setLookbackDays] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [balanceData, setBalanceData] = useState<any>(null);
  const backend = useBackend();
  const { toast } = useToast();

  const handleGetBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setBalanceData(null);

    try {
      const result = await backend.paypal.getBalance({
        environment,
        lookbackDays: parseInt(lookbackDays),
      });

      setBalanceData(result);
      toast({
        title: "Balance Retrieved!",
        description: `Found ${result.balances.length} balance entries`,
      });
    } catch (error: any) {
      console.error('Balance check error:', error);
      setBalanceData({ error: error.message });
      toast({
        title: "Balance Check Failed",
        description: error.message || "Failed to retrieve balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleGetBalance} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <Select value={environment} onValueChange={(value: 'sandbox' | 'live') => setEnvironment(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lookbackDays">Lookback Period (Days)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="lookbackDays"
                type="number"
                min="1"
                max="365"
                value={lookbackDays}
                onChange={(e) => setLookbackDays(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Balance...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Get Balance
            </>
          )}
        </Button>
      </form>

      {balanceData && (
        <div className="space-y-4">
          {balanceData.error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-red-600 font-mono text-sm bg-red-50 p-4 rounded">
                  Error: {balanceData.error}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Balances</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{balanceData.balances.length}</p>
                    <p className="text-sm text-gray-600">Currency types</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Transactions</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{balanceData.transactionCount}</p>
                    <p className="text-sm text-gray-600">Last {balanceData.lookbackDays} days</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Period</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{balanceData.lookbackDays}</p>
                    <p className="text-sm text-gray-600">Days analyzed</p>
                  </CardContent>
                </Card>
              </div>

              {balanceData.balances.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Account Balances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {balanceData.balances.map((balance: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">{balance.currency}</Badge>
                            <span className="font-medium">{balance.currency}</span>
                          </div>
                          <span className="text-lg font-bold">{balance.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>API Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                    {JSON.stringify(balanceData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
