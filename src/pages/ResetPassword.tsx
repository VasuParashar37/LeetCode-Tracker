import { FormEvent, useEffect, useState } from 'react';
import { Loader2, LockKeyhole } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { toast } from '@/ui/use-toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const passwordError = password.length > 0 && password.length < 8 ? 'Use at least 8 characters.' : '';

  useEffect(() => {
    const establishRecoverySession = async () => {
      const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          toast({
            title: 'Invalid reset link',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setIsRecoverySession(true);
        }
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsRecoverySession(Boolean(session));
      }

      setIsReady(true);
    };

    establishRecoverySession();
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!password.trim()) {
      toast({
        title: 'Password required',
        description: 'Enter a new password to finish resetting your account.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Use at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please enter the same new password in both fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Could not update password',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Password updated',
      description: 'You can now sign in with your new password.',
    });
    navigate('/', { replace: true });
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isRecoverySession) {
    return (
      <div className="min-h-screen bg-background px-4 py-12">
        <div className="mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 sm:p-8 text-center"
          >
            <h1 className="font-mono text-2xl font-bold text-foreground">Reset Link Required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Open this page from the password reset email so we can verify your account before changing the password.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/">Back to Sign In</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-8"
        >
          <div className="mb-6 space-y-2 text-center">
            <h1 className="font-mono text-2xl font-bold text-foreground">Choose a New Password</h1>
            <p className="text-sm text-muted-foreground">
              Set a new password for your LeetCode Tracker account, then we&apos;ll take you back to the app.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="bg-background/50"
              />
              {passwordError && <p className="text-xs text-muted-foreground">{passwordError}</p>}
            </div>
            <Input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={event => setConfirmPassword(event.target.value)}
              className="bg-background/50"
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="mr-2 h-4 w-4" />
              )}
              Update Password
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
