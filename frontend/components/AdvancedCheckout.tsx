import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useBackend } from '../hooks/useBackend';
import { Loader2, ExternalLink, DollarSign } from 'lucide-react';

export function AdvancedCheckout() {
  const [amount, setAmount] = useState('10.00');
  const [currency, setCurrency] = useState('USD');
  const [environment, setEnvironment] = useState<'sandbox' | 'live'>('sandbox');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const backend = useBackend();
  const { toast } = useToast();

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse(null);

    try {
      const result = await backend.paypal.createPayment({
        amount: parseFloat(amount),
        currency,
        environment,
        description: description || undefined,
      });

      setResponse(result);
      toast({
        title: "Payment Created!",
        description: `Payment ${result.paymentId} created successfully`,
      });
    } catch (error: any) {
      console.error('Payment creation error:', error);
      setResponse({ error: error.message });
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to create payment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreatePayment} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Payment description"
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Payment...
            </>
          ) : (
            'Create Payment'
          )}
        </Button>
      </form>

      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              API Response
              {response.status && (
                <Badge variant={response.status === 'created' ? 'default' : 'destructive'}>
                  {response.status}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {response.error ? (
              <div className="text-red-600 font-mono text-sm bg-red-50 p-4 rounded">
                Error: {response.error}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Payment ID</Label>
                    <p className="font-mono text-sm">{response.paymentId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Amount</Label>
                    <p className="font-mono text-sm">{response.amount} {response.currency}</p>
                  </div>
                </div>
                
                {response.approvalUrl && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Approval URL</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(response.approvalUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in PayPal
                      </Button>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Full Response</Label>
                  <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
