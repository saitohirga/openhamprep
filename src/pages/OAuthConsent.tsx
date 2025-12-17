import { useState } from 'react';
import { useOAuthConsent } from '@/hooks/useOAuthConsent';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function OAuthConsent() {
  const {
    isLoading,
    error,
    authorizationDetails,
    isProcessing,
    isAutoApproving,
    handleApprove,
    handleCancel,
  } = useOAuthConsent();

  const [forumUsername, setForumUsername] = useState('');

  if (isLoading || isAutoApproving) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            {isAutoApproving
              ? 'Connecting to the forum...'
              : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Authorization Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.history.back()} className="w-full">
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!authorizationDetails) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Create Your Forum Username</CardTitle>
          <CardDescription>
            Choose a username to use on the Open Ham Prep forum. This will be visible to other users.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="forum-username" className="text-sm font-medium">
              Forum Username
            </Label>
            <Input
              id="forum-username"
              value={forumUsername}
              onChange={(e) => setForumUsername(e.target.value)}
              placeholder="Choose a username"
              disabled={isProcessing}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              3-20 characters: letters, numbers, underscores, or hyphens.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleApprove(forumUsername)}
            disabled={isProcessing || !forumUsername.trim()}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Continue to Forum'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
