import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletStore } from '@/store/useWalletStore';
import FundManagement from '@/components/dashboard/fundsManagement';
import { TransactionHistory } from '@/components/dashboard/TransactionHistory';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const ManageFunds = () => {
  const navigate = useNavigate();
  const { account, isConnecting, disconnect } = useWalletStore();

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          Connecting to wallet...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="flex items-center gap-2 hover:bg-accent"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {!account ? (
          <Card className="mt-8">
            <CardContent className="flex items-center justify-center min-h-[200px]">
              <div className="text-center text-muted-foreground">
                Please connect your wallet to manage funds
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Fund Management Card */}
            <Card className="w-full shadow-lg rounded-lg">
              <CardHeader className="flex items-center justify-between border-b p-4">
                <CardTitle>Manage Funds</CardTitle>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={disconnect}
                    className="hover:bg-accent"
                  >
                    Disconnect
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <FundManagement />
              </CardContent>
            </Card>

            {/* Transaction History Card */}
            <Card className="w-full shadow-lg rounded-lg">
              <CardHeader className="border-b p-4">
                <CardTitle>Transaction History</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <TransactionHistory />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageFunds;
