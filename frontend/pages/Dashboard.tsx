import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBackend } from '../hooks/useBackend';
import { Header } from '../components/Header';
import { AdvancedCheckout } from '../components/AdvancedCheckout';
import { BalanceInsights } from '../components/BalanceInsights';
import { CredentialsManager } from '../components/CredentialsManager';
import { TransactionHistory } from '../components/TransactionHistory';
import { CreditCard, BarChart3, Settings, History, Sparkles } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const backend = useBackend();
  const [activeTab, setActiveTab] = useState('checkout');
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [currentBalance, setCurrentBalance] = useState<any>(null);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [availableCredentials, setAvailableCredentials] = useState<any[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<string>('');
  const [isValidatingCredentials, setIsValidatingCredentials] = useState(false);
  const [apiValidationResult, setApiValidationResult] = useState<any>(null);
  const [showCardPayment, setShowCardPayment] = useState(false);
  const [transactionDateRange, setTransactionDateRange] = useState<string>('5');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const validateSelectedCredentials = async () => {
    if (!selectedCredential) {
      return;
    }

    setIsValidatingCredentials(true);
    setApiValidationResult(null);
    setShowCardPayment(false);

    try {
      const [credentialId, environment] = selectedCredential.split(':');
      
      // Test the credentials by trying to get balance
      const balanceResult = await backend.paypal.getBalance({
        environment: environment as 'sandbox' | 'live',
        lookbackDays: 1,
        credentialId: credentialId,
      });
      
      // Mock API capability check - in real implementation, this would be determined by PayPal API response
      const apiCapabilities = {
        supportsAdvancedCheckout: Math.random() > 0.5, // Random for demo - replace with actual capability check
        supportsCardPayments: true,
        accountType: environment === 'sandbox' ? 'Sandbox Account' : 'Live Account',
        clientId: availableCredentials.find(c => c.id === credentialId)?.clientId || 'Unknown',
        balances: balanceResult.balances || [],
        lastValidated: new Date().toISOString(),
      };

      setApiValidationResult({
        success: true,
        environment,
        capabilities: apiCapabilities,
        message: 'API Credentials validated successfully!',
      });

      // Update current balance with the validated result
      setCurrentBalance(balanceResult);

      // Show card payment option if API supports it (most APIs do)
      setShowCardPayment(apiCapabilities.supportsCardPayments);
      
    } catch (error: any) {
      console.error('Credential validation failed:', error);
      setApiValidationResult({
        success: false,
        error: error.message || 'Validation failed',
        message: 'API Credentials validation failed. Please check your credentials.',
      });
      setShowCardPayment(false);
    } finally {
      setIsValidatingCredentials(false);
    }
  };

  // Load recent transactions and credentials on component mount
  useEffect(() => {
    loadAvailableCredentials();
  }, []);

  // Load transactions when credentials are available
  useEffect(() => {
    if (selectedCredential) {
      loadRecentTransactions();
    }
  }, [selectedCredential]);

  // Set default custom dates
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    if (!customStartDate) {
      setCustomStartDate(fiveDaysAgo.toISOString().split('T')[0]);
    }
    if (!customEndDate) {
      setCustomEndDate(today);
    }
  }, []);

  const getTodaysTransactions = () => {
    const today = new Date().toISOString().split('T')[0];
    loadRecentTransactions(undefined, today, today);
  };

  const loadAvailableCredentials = async () => {
    try {
      const result = await backend.paypal.getCredentials({});
      setAvailableCredentials(result.credentials);
      if (result.credentials.length > 0 && !selectedCredential) {
        setSelectedCredential(`${result.credentials[0].id}:${result.credentials[0].environment}`);
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
      setAvailableCredentials([]);
    }
  };

  const loadRecentTransactions = async (customDays?: number, startDate?: string, endDate?: string) => {
    if (!selectedCredential) {
      console.error('No credential selected');
      return;
    }

    setIsLoadingTransactions(true);
    try {
      const [credentialId, environment] = selectedCredential.split(':');
      
      // Determine the date range
      let lookbackDays = customDays || parseInt(transactionDateRange);
      
      // If custom dates are provided, calculate the range
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        lookbackDays = Math.min(diffDays, 31); // PayPal max is 31 days
      }
      
      // Get recent transactions from PayPal API via balance endpoint
      const requestParams: any = {
        environment: environment as 'sandbox' | 'live',
        credentialId: credentialId,
      };

      if (startDate && endDate) {
        requestParams.startDate = startDate;
        requestParams.endDate = endDate;
      } else {
        requestParams.lookbackDays = lookbackDays;
      }

      const result = await backend.paypal.getBalance(requestParams);
      
      // Update current balance as well since we're getting fresh data
      setCurrentBalance(result);
      
    } catch (error) {
      console.error('Failed to load recent transactions:', error);
      
      // Fallback to database transactions if PayPal API fails
      try {
        const dbResult = await backend.transaction.getHistory({
          limit: 10,
          offset: 0,
        });
        setRecentTransactions(dbResult.transactions);
      } catch (dbError) {
        console.error('Failed to load database transactions:', dbError);
        setRecentTransactions([]);
      }
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const loadCurrentBalance = async () => {
    if (!selectedCredential) {
      console.error('No credential selected');
      return;
    }

    setIsLoadingBalance(true);
    try {
      const [credentialId, environment] = selectedCredential.split(':');
      const result = await backend.paypal.getBalance({
        environment: environment as 'sandbox' | 'live',
        lookbackDays: 30,
        credentialId: credentialId,
      });
      setCurrentBalance(result);
    } catch (error) {
      console.error('Failed to load current balance:', error);
      setCurrentBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const formatAmount = (amount: number | null, currency: string | null) => {
    if (amount === null || currency === null) return 'N/A';
    const sign = amount >= 0 ? '' : '-';
    return `${sign}${Math.abs(amount).toFixed(2)} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().replace('.000Z', 'Z');
  };

  const getAmountColor = (amount: number | null) => {
    if (amount === null) return 'text-gray-400';
    return amount >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />
      
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Sparkles className="h-8 w-8 text-cyan-400" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-200 to-blue-400 bg-clip-text text-transparent">
                  {t('dashboard.welcome')}, {user?.firstName}
                </h1>
              </div>
              <p className="text-slate-400 text-lg font-light tracking-wide">
                {t('dashboard.subtitle')}
              </p>
            </div>
            
            {/* API Credentials Selector */}
            <div className="flex items-center space-x-4">
              <div className="flex flex-col space-y-3">
                <Label className="text-sm font-medium text-cyan-300 tracking-wider uppercase">{t('dashboard.activeCredentials')}</Label>
                <div className="flex items-center space-x-3">
                  <Select 
                    value={selectedCredential} 
                    onValueChange={setSelectedCredential}
                  >
                    <SelectTrigger className="w-64 bg-slate-800/50 border-slate-700 text-white backdrop-blur-sm hover:bg-slate-800/70 transition-all">
                      <SelectValue placeholder={t('dashboard.selectCredentials')} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      {availableCredentials.map((cred) => (
                        <SelectItem 
                          key={cred.id} 
                          value={`${cred.id}:${cred.environment}`}
                          className="text-white hover:bg-slate-800"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{cred.remark}</span>
                            <span className="text-xs bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 px-2 py-1 rounded-full border border-cyan-500/30">
                              {cred.environment}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      {availableCredentials.length === 0 && (
                        <SelectItem value="none" disabled>
                          {t('dashboard.noCredentials')}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validateSelectedCredentials}
                    disabled={!selectedCredential || selectedCredential === 'none' || isValidatingCredentials}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-none shadow-lg shadow-cyan-500/25 transition-all"
                  >
                    {isValidatingCredentials ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('dashboard.validating')}
                      </div>
                    ) : t('dashboard.validate')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Validation Results */}
        {apiValidationResult && (
          <div className="mb-8">
            <Card className={`border-l-4 backdrop-blur-sm ${apiValidationResult.success ? 'border-l-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'border-l-red-400 bg-red-500/10 border-red-500/20'}`}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-semibold ${apiValidationResult.success ? 'text-emerald-300' : 'text-red-300'}`}>
                      {apiValidationResult.success ? t('dashboard.apiValidationSuccess') : t('dashboard.apiValidationFailed')}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${apiValidationResult.success ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                      {apiValidationResult.environment?.toUpperCase() || 'Unknown'}
                    </span>
                  </div>

                  {apiValidationResult.success && apiValidationResult.capabilities && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-200 text-lg">{t('dashboard.apiInfo')}</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                            <span className="text-slate-400">{t('dashboard.accountType')}:</span>
                            <span className="font-medium text-white">{apiValidationResult.capabilities.accountType}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                            <span className="text-slate-400">{t('dashboard.clientId')}:</span>
                            <span className="font-mono text-xs text-cyan-300">{apiValidationResult.capabilities.clientId.substring(0, 20)}...</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
                            <span className="text-slate-400">{t('dashboard.lastValidated')}:</span>
                            <span className="text-xs text-slate-300">{new Date(apiValidationResult.capabilities.lastValidated).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-200 text-lg">{t('dashboard.capabilities')}</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className={`w-3 h-3 rounded-full ${apiValidationResult.capabilities.supportsAdvancedCheckout ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'}`}></span>
                              <span className="text-sm text-slate-300">{t('dashboard.advancedCheckout')}</span>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full border ${apiValidationResult.capabilities.supportsAdvancedCheckout ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                              {apiValidationResult.capabilities.supportsAdvancedCheckout ? t('dashboard.supported') : t('dashboard.notSupported')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <span className={`w-3 h-3 rounded-full ${apiValidationResult.capabilities.supportsCardPayments ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'}`}></span>
                              <span className="text-sm text-slate-300">{t('dashboard.cardPayments')}</span>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-full border ${apiValidationResult.capabilities.supportsCardPayments ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                              {apiValidationResult.capabilities.supportsCardPayments ? t('dashboard.supported') : t('dashboard.notSupported')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!apiValidationResult.success && (
                    <div className="text-red-300 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                      <p className="font-medium">{t('dashboard.errorDetails')}:</p>
                      <p className="text-sm mt-1">{apiValidationResult.error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex lg:h-12 bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl p-1">
            <TabsTrigger value="checkout" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white text-slate-400 font-medium transition-all rounded-lg">
              <CreditCard className="h-4 w-4" />
              {t('tabs.checkout')}
            </TabsTrigger>
            <TabsTrigger value="balance" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-600 data-[state=active]:text-white text-slate-400 font-medium transition-all rounded-lg">
              <BarChart3 className="h-4 w-4" />
              {t('tabs.balance')}
            </TabsTrigger>
            <TabsTrigger value="credentials" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white text-slate-400 font-medium transition-all rounded-lg">
              <Settings className="h-4 w-4" />
              {t('tabs.credentials')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white text-slate-400 font-medium transition-all rounded-lg">
              <History className="h-4 w-4" />
              {t('tabs.history')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checkout" className="space-y-6">
            <Card className="bg-slate-900/40 backdrop-blur-sm border-slate-700 shadow-2xl shadow-cyan-500/10">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/25">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent font-bold">
                    {t('checkout.title')}
                  </span>
                </CardTitle>
                <CardDescription className="text-slate-400 text-base">
                  {t('checkout.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* Amount Input */}
                  <div className="space-y-3">
                    <Label htmlFor="amount" className="text-sm font-medium uppercase tracking-wider text-cyan-300">
                      {t('checkout.amount')}
                    </Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="1.00"
                        defaultValue="1.00"
                        className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 backdrop-blur-sm focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                        placeholder="1.00"
                      />
                      <Button 
                        variant="outline" 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-none shadow-lg shadow-blue-500/25 transition-all"
                      >
                        {t('checkout.validateApi')}
                      </Button>
                    </div>
                  </div>

                  {/* Card Fields Container */}
                  <div className="space-y-6 p-8 bg-gradient-to-br from-slate-800/20 to-slate-900/20 rounded-xl border-2 border-dashed border-slate-600 backdrop-blur-sm">
                    {/* Cardholder Name */}
                    <div className="space-y-2">
                      <Input
                        placeholder={t('checkout.cardholderName')}
                        className="w-full bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 backdrop-blur-sm focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>

                    {/* Card Number */}
                    <div className="space-y-2">
                      <Input
                        placeholder={t('checkout.cardNumber')}
                        className="w-full bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 backdrop-blur-sm focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>

                    {/* Expiry and CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder={t('checkout.expiryDate')}
                        className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 backdrop-blur-sm focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                      />
                      <Input
                        placeholder={t('checkout.cvv')}
                        className="bg-slate-800/50 border-slate-600 text-white placeholder-slate-400 backdrop-blur-sm focus:border-cyan-500 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Collect Payment Button */}
                  <Button className="w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white py-4 text-lg font-semibold shadow-2xl shadow-cyan-500/25 transition-all transform hover:scale-[1.02]">
                    <span className="mr-2">💳</span>
                    {t('checkout.collectPayment')}
                  </Button>

                  {/* Status Message */}
                  <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700 backdrop-blur-sm">
                    <p className="text-slate-400 text-center font-medium">
                      <span className="inline-block w-2 h-2 bg-amber-400 rounded-full mr-2 animate-pulse"></span>
                      {t('checkout.awaitingValidation')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance" className="space-y-6">
            <Card className="bg-slate-900/40 backdrop-blur-sm border-slate-700 shadow-2xl shadow-emerald-500/10">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg shadow-lg shadow-emerald-500/25">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent font-bold">
                    {t('balance.insights')}
                  </span>
                </CardTitle>
                <CardDescription className="text-slate-400 text-base">
                  {t('balance.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* Current Balance Section */}
                  <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 text-white p-8 rounded-xl border border-slate-700 backdrop-blur-sm">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-emerald-300">{t('balance.currentBalanceTitle')}</h3>
                      <p className="text-slate-400">
                        {t('balance.currentBalanceDesc')}
                      </p>
                      <div className="mt-6">
                        {currentBalance ? (
                          <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                            {t('balance.current')}: {currentBalance.balances[0]?.value || '0.00'} {currentBalance.balances[0]?.currency || 'USD'}
                          </p>
                        ) : (
                          <p className="text-4xl font-bold text-slate-500">
                            {t('balance.current')}: {t('balance.notLoaded')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recent Transactions Section */}
                  <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 text-white p-8 rounded-xl border border-slate-700 backdrop-blur-sm">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-cyan-300">{t('balance.recentTransactions')}</h3>
                          <p className="text-slate-400 mt-1">
                            {t('balance.recentTransactionsDesc')}
                          </p>
                        </div>
                        
                        {/* Date Range Controls */}
                        <div className="flex items-center space-x-3">
                          <Select value={transactionDateRange} onValueChange={setTransactionDateRange}>
                            <SelectTrigger className="w-36 bg-slate-800/50 border-slate-600 text-white backdrop-blur-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700">
                              <SelectItem value="1" className="text-white hover:bg-slate-800">{t('balance.today')}</SelectItem>
                              <SelectItem value="3" className="text-white hover:bg-slate-800">{t('balance.last3days')}</SelectItem>
                              <SelectItem value="5" className="text-white hover:bg-slate-800">{t('balance.last5days')}</SelectItem>
                              <SelectItem value="7" className="text-white hover:bg-slate-800">{t('balance.last7days')}</SelectItem>
                              <SelectItem value="15" className="text-white hover:bg-slate-800">{t('balance.last15days')}</SelectItem>
                              <SelectItem value="30" className="text-white hover:bg-slate-800">{t('balance.last30days')}</SelectItem>
                              <SelectItem value="custom" className="text-white hover:bg-slate-800">{t('balance.customRange')}</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadRecentTransactions(parseInt(transactionDateRange))}
                            disabled={isLoadingTransactions}
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-none shadow-lg shadow-cyan-500/25"
                          >
                            {isLoadingTransactions ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                {t('common.loading')}
                              </div>
                            ) : t('balance.update')}
                          </Button>
                        </div>
                      </div>

                      {/* Custom Date Range */}
                      {transactionDateRange === 'custom' && (
                        <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700 backdrop-blur-sm">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                              <Label className="text-sm text-cyan-300 font-medium">{t('balance.startDate')}</Label>
                              <Input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="bg-slate-800/50 border-slate-600 text-white backdrop-blur-sm focus:border-cyan-500 focus:ring-cyan-500/20"
                                max={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-cyan-300 font-medium">{t('balance.endDate')}</Label>
                              <Input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="bg-slate-800/50 border-slate-600 text-white backdrop-blur-sm focus:border-cyan-500 focus:ring-cyan-500/20"
                                max={new Date().toISOString().split('T')[0]}
                                min={customStartDate}
                              />
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => loadRecentTransactions(undefined, customStartDate, customEndDate)}
                              disabled={!customStartDate || !customEndDate || isLoadingTransactions}
                              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white border-none shadow-lg shadow-emerald-500/25"
                            >
                              {t('balance.searchRange')}
                            </Button>
                          </div>
                          <p className="text-xs text-slate-400 mt-3">
                            {t('balance.maxRange')}
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-300">{t('balance.mostRecent')}</p>
                        
                        <div className="space-y-4 mt-6">
                          {isLoadingTransactions ? (
                            <div className="flex items-center justify-center p-12">
                              <div className="flex flex-col items-center space-y-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                                <p className="text-slate-400 font-medium">{t('balance.loadingTransactions')}</p>
                              </div>
                            </div>
                          ) : currentBalance?.recentTransactions && currentBalance.recentTransactions.length > 0 ? (
                            currentBalance.recentTransactions.map((transaction: any, index: number) => (
                              <div key={`${transaction.transactionId}-${index}`} className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-800/40 to-slate-900/40 rounded-xl border border-slate-700 backdrop-blur-sm hover:border-slate-600 transition-all">
                                <div className="space-y-2">
                                  <p className="font-semibold text-white text-lg">{transaction.transactionId}</p>
                                  <p className="text-sm text-slate-400">{formatDate(transaction.date)} —</p>
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.status === 'S' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                      {t('balance.status')}: {transaction.status}
                                    </span>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                      {t('balance.code')}: {transaction.eventCode}
                                    </span>
                                  </div>
                                  {transaction.note && (
                                    <p className="text-xs text-slate-400 italic">{transaction.note}</p>
                                  )}
                                </div>
                                <div className="text-right space-y-1">
                                  <p className={`font-bold text-xl ${transaction.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {transaction.amount} {transaction.currency}
                                  </p>
                                  {transaction.fee !== "0.00" && (
                                    <p className="text-xs text-red-300">{t('balance.fee')}: {transaction.fee} {transaction.currency}</p>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : recentTransactions.length > 0 ? (
                            recentTransactions.map((transaction) => (
                              <div key={transaction.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-800/40 to-slate-900/40 rounded-xl border border-slate-700 backdrop-blur-sm hover:border-slate-600 transition-all">
                                <div className="space-y-2">
                                  <p className="font-semibold text-white text-lg">{transaction.transactionId}</p>
                                  <p className="text-sm text-slate-400">{formatDate(transaction.createdAt)} —</p>
                                  <div className="flex items-center space-x-2">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      {transaction.type.replace('_', ' ')}
                                    </span>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                      {transaction.environment}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right space-y-1">
                                  <p className={`font-bold text-xl ${getAmountColor(transaction.amount)}`}>
                                    {transaction.amount ? formatAmount(transaction.amount, transaction.currency) : 'N/A'}
                                  </p>
                                  <p className="text-xs text-slate-400 capitalize">{transaction.status}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center p-12">
                              <div className="text-center space-y-3">
                                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto">
                                  <BarChart3 className="h-8 w-8 text-slate-400" />
                                </div>
                                <p className="text-slate-400 font-medium">{t('balance.noTransactions')}</p>
                                <p className="text-slate-500 text-sm">{t('balance.noTransactionsDesc')}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-[1.02]"
                      onClick={loadCurrentBalance}
                      disabled={isLoadingBalance}
                    >
                      {isLoadingBalance ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('common.loading')}
                        </div>
                      ) : (
                        <>
                          <span className="mr-2">💰</span>
                          {t('balance.getCurrentBalance')}
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => loadRecentTransactions()}
                      disabled={isLoadingTransactions}
                      className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border-slate-600 shadow-lg transition-all transform hover:scale-[1.02]"
                    >
                      {isLoadingTransactions ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('common.loading')}
                        </div>
                      ) : (
                        <>
                          <span className="mr-2">🔄</span>
                          {t('balance.refreshTransactions')}
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={getTodaysTransactions}
                      disabled={isLoadingTransactions}
                      className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border-none shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-[1.02]"
                    >
                      {isLoadingTransactions ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('common.loading')}
                        </div>
                      ) : (
                        <>
                          <span className="mr-2">📅</span>
                          {t('balance.todaysTransactions')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credentials" className="space-y-6">
            <Card className="bg-slate-900/40 backdrop-blur-sm border-slate-700 shadow-2xl shadow-purple-500/10">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg shadow-purple-500/25">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent font-bold">
                    {t('credentials.managerTitle')}
                  </span>
                </CardTitle>
                <CardDescription className="text-slate-400 text-base">
                  {t('credentials.managerDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <CredentialsManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-slate-900/40 backdrop-blur-sm border-slate-700 shadow-2xl shadow-orange-500/10">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg shadow-lg shadow-orange-500/25">
                    <History className="h-6 w-6 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent font-bold">
                    {t('transactions.historyTitle')}
                  </span>
                </CardTitle>
                <CardDescription className="text-slate-400 text-base">
                  {t('transactions.historyDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <TransactionHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
