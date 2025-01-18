import React from 'react';
import { useWalletStore } from '@/store/useWalletStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, AlertCircle } from 'lucide-react';


export default function WalletConnect() {
  const { 
    connectMetaMask, 
    disconnect,
    account, 
    isConnecting, 
    error,
    balance 
  } = useWalletStore();

  const handleConnect = async () => {
    try {
      if (window.ethereum){
        await connectMetaMask();
      }  else {
        window.open('https://metamask.io/download/', '_blank');
      }
    }
    catch (err) {
      // Error handling is managed by the store
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (bal: number) => {
    return `${bal.toFixed(4)} ETH`;
  };

  if (isConnecting) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-500">Connecting to wallet...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (account) {
    return (
      <Card className="max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Wallet Connected</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Address</span>
              <span className="font-mono">{formatAddress(account)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Balance</span>
              <span className="font-medium">{formatBalance(balance)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Connect Wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button
          className="w-full"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect MetaMask
        </Button>

        {!window.ethereum && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              MetaMask is not installed. Please install MetaMask to continue.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
