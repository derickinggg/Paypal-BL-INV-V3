import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useBackend } from '../hooks/useBackend';
import { useLanguage } from '../contexts/LanguageContext';
import { Loader2, Eye, EyeOff, Key, Shield, CheckCircle } from 'lucide-react';

export function CredentialsManager() {
  const [environment, setEnvironment] = useState<'sandbox' | 'live'>('sandbox');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [remark, setRemark] = useState('');
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingCredentials, setExistingCredentials] = useState<any>(null);
  const backend = useBackend();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadExistingCredentials();
  }, []);

  const getSandboxCount = () => {
    return existingCredentials?.credentials?.filter((c: any) => c.environment === 'sandbox').length || 0;
  };

  const getLiveCount = () => {
    return existingCredentials?.credentials?.filter((c: any) => c.environment === 'live').length || 0;
  };

  const loadExistingCredentials = async () => {
    try {
      const result = await backend.paypal.getCredentials({});
      setExistingCredentials(result);
    } catch (error) {
      setExistingCredentials({ credentials: [] });
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await backend.paypal.saveCredentials({
        environment,
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        remark: remark.trim(),
      });

      toast({
        title: "Credentials Saved!",
        description: `${environment} credentials "${remark}" have been securely stored`,
      });

      // Reset form
      setClientId('');
      setClientSecret('');
      setRemark('');
      
      await loadExistingCredentials();
    } catch (error: any) {
      console.error('Save credentials error:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCredentials = async (credentialId: string) => {
    try {
      await backend.paypal.deleteCredentials({ id: credentialId });
      
      toast({
        title: "Credentials Deleted",
        description: "The credentials have been permanently removed",
      });
      
      await loadExistingCredentials();
    } catch (error: any) {
      console.error('Delete credentials error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Shield className="h-5 w-5" />
              Sandbox Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-4">
              Use sandbox credentials for testing and development. All transactions are simulated.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={getSandboxCount() > 0 ? 'default' : 'outline'}>
                {getSandboxCount()} credential{getSandboxCount() !== 1 ? 's' : ''}
              </Badge>
              {getSandboxCount() > 0 && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Key className="h-5 w-5" />
              Live Environment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 mb-4">
              Use live credentials for production. Real money transactions will be processed.
            </p>
            <div className="flex items-center gap-2">
              <Badge variant={getLiveCount() > 0 ? 'default' : 'outline'}>
                {getLiveCount()} credential{getLiveCount() !== 1 ? 's' : ''}
              </Badge>
              {getLiveCount() > 0 && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('credentials.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Add New Credential Form */}
          <form onSubmit={handleSaveCredentials} className="space-y-4 mb-6">
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
              <Label htmlFor="remark">Remark/Name</Label>
              <Input
                id="remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="e.g., Main Account, Test Account, etc."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter your PayPal Client ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showClientSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your PayPal Client Secret"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                >
                  {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Shared Credentials</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    These PayPal credentials are shared across your organization. 
                    All team members can use these credentials for internal operations.
                  </p>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Add Credentials
                </>
              )}
            </Button>
          </form>

          {/* Existing Credentials List */}
          {existingCredentials && existingCredentials.credentials.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Shared API Credentials</h3>
                <Badge variant="outline">
                  {existingCredentials.credentials.length} credential{existingCredentials.credentials.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {existingCredentials.credentials.map((cred: any) => (
                  <Card key={cred.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={cred.environment === 'sandbox' ? 'secondary' : 'default'}>
                              {cred.environment}
                            </Badge>
                            <span className="font-medium">{cred.remark}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p className="font-mono break-all">Client ID: {cred.clientId}</p>
                            <p className="text-xs">Added: {new Date(cred.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCredentials(cred.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {existingCredentials && existingCredentials.credentials.length === 0 && (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API credentials found</h3>
              <p className="text-gray-600">
                Add your first PayPal API credentials using the form above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
