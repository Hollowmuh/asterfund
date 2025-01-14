import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Wallet } from 'lucide-react';
import { useWalletStore } from '@/store/useWalletStore';

export function WalletConnect() {
  const [showDialog, setShowDialog] = useState(false);
  const { connectMetaMask, isConnecting, error } = useWalletStore();

  const handleMetaMaskConnect = async () => {
    try {
      await connectMetaMask();
      setShowDialog(false);
    } catch (err) {
      console.error('Error connecting wallet:', err);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md backdrop-blur-sm bg-white/10 border-none">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowDialog(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Select Wallet
                </>
              )}
            </Button>
            {error && (
              <p className="mt-2 text-sm text-red-400 text-center">{error}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog} aria-labelledby="wallet-dialog-title">
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle id="wallet-dialog-title">Connect Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 flex items-center justify-center gap-2"
              onClick={handleMetaMaskConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <img
                  src="/metamask-fox.svg"
                  alt="MetaMask Logo"
                  className="h-4 w-4"
                />
              )}
              MetaMask
            </Button>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              disabled
            >
              <Wallet className="mr-2 h-4 w-4" />
              WalletConnect (Coming Soon)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
