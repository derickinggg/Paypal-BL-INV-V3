import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBackend } from '../hooks/useBackend';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Filter, Calendar, DollarSign } from 'lucide-react';
import type { Transaction } from '~backend/transaction/history';

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [environment, setEnvironment] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const backend = useBackend();
  const { toast } = useToast();
  const { t } = useLanguage();

  const limit = 20;

  useEffect(() => {
    loadTransactions(true);
  }, [environment]);

  const loadTransactions = async (reset = false) => {
    setIsLoading(true);
    const currentOffset = reset ? 0 : offset;

    try {
      const params: any = {
        limit,
        offset: currentOffset,
      };

      if (environment !== 'all') {
        params.environment = environment;
      }

      const result = await backend.transaction.getHistory(params);
      
      if (reset) {
        setTransactions(result.transactions);
        setOffset(limit);
      } else {
        setTransactions(prev => [...prev, ...result.transactions]);
        setOffset(prev => prev + limit);
      }
      
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (error: any) {
      console.error('Transaction history error:', error);
      toast({
        title: "Failed to Load Transactions",
        description: error.message || "Failed to retrieve transaction history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setOffset(0);
    loadTransactions(true);
  };

  const handleLoadMore = () => {
    loadTransactions(false);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      created: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      approved: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      failed: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className={type === 'payment' ? 'border-blue-300' : 'border-green-300'}>
        {type === 'payment' ? 'Payment' : 'Balance Check'}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Environments</SelectItem>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-gray-600">
            {total} total transaction{total !== 1 ? 's' : ''}
          </div>
        </div>

        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {transactions.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">
                {environment === 'all' 
                  ? 'You haven\'t made any transactions yet.'
                  : `No transactions found for ${environment} environment.`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      {getTypeBadge(transaction.type)}
                      {getStatusBadge(transaction.status)}
                      <Badge variant="secondary">
                        {transaction.environment}
                      </Badge>
                    </div>
                    
                    <div className="font-mono text-sm text-gray-600">
                      ID: {transaction.transactionId}
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>

                  <div className="text-right">
                    {transaction.amount && transaction.currency && (
                      <div className="flex items-center text-lg font-semibold">
                        <DollarSign className="h-5 w-5 text-green-600 mr-1" />
                        {transaction.amount.toFixed(2)} {transaction.currency}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
