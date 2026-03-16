import { FormEvent, useState } from 'react';
import { Loader2, LogIn, Mail, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { toast } from '@/ui/use-toast';

type AuthMode = 'sign-in' | 'sign-up' | 'reset-password';

export const AuthForm = () => {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const isSignIn = mode === 'sign-in';
  const isResetMode = mode === 'reset-password';
  const trimmedEmail = email.trim();
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const passwordError =
    !isResetMode && password.length > 0 && password.length < 8
      ? 'Use at least 8 characters.'
      : '';

  const sendConfirmationEmail = async (targetEmail: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: targetEmail.trim(),
    });

    if (error) {
      toast({
        title: 'Could not resend confirmation',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Confirmation email sent',
      description: 'Check your inbox and open the Supabase confirmation link.',
    });
    return true;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!trimmedEmail) {
      toast({
        title: 'Email required',
        description: 'Enter your email to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (!emailLooksValid) {
      toast({
        title: 'Invalid email',
        description: 'Enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    if (!isResetMode && !password.trim()) {
      toast({
        title: 'Password required',
        description: 'Enter your password to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (!isResetMode && password.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Use at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    if (isResetMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setIsSubmitting(false);

      if (error) {
        toast({
          title: 'Could not send reset email',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Reset email sent',
        description: 'Open the link in your email to choose a new password.',
      });
      return;
    }

    const authAction = isSignIn
      ? supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        })
      : supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });

    const { data, error } = await authAction;
    setIsSubmitting(false);

    if (error) {
      const isEmailNotConfirmed = error.message.toLowerCase().includes('email not confirmed');
      if (isEmailNotConfirmed) {
        setConfirmationEmail(trimmedEmail);
        toast({
          title: 'Email confirmation required',
          description: 'Please confirm your email first, or resend the confirmation below.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Authentication failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    if (!isSignIn && !data.session) {
      setConfirmationEmail(trimmedEmail);
      toast({
        title: 'Check your email',
        description: 'Supabase sent a confirmation link before the account can sign in.',
      });
      return;
    }

    toast({
      title: isSignIn ? 'Signed in' : 'Account created',
      description: isSignIn
        ? 'Your tracker is now connected to your Supabase account.'
        : 'Your Supabase account is ready.',
    });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-8"
        >
          <div className="mb-6 space-y-2 text-center">
            <h1 className="font-mono text-2xl font-bold text-foreground">LeetCode Tracker</h1>
            <p className="text-sm text-muted-foreground">
              {isResetMode
                ? 'Enter your email and we will send you a password reset link.'
                : 'Sign in so we can store your questions in Supabase instead of only in this browser.'}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-2 rounded-lg bg-secondary/50 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('sign-in');
                setConfirmationEmail('');
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isSignIn ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('sign-up');
                setConfirmationEmail('');
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === 'sign-up' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('reset-password');
                setConfirmationEmail('');
              }}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isResetMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              Reset
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="bg-background/50"
            />
            {!isResetMode && (
              <div className="space-y-1">
                <Input
                  type="password"
                  autoComplete={isSignIn ? 'current-password' : 'new-password'}
                  placeholder="Password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="bg-background/50"
                />
                {passwordError && <p className="text-xs text-muted-foreground">{passwordError}</p>}
              </div>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isResetMode ? (
                <Mail className="mr-2 h-4 w-4" />
              ) : isSignIn ? (
                <LogIn className="mr-2 h-4 w-4" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              {isResetMode ? 'Send Reset Link' : isSignIn ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {confirmationEmail && !isResetMode && (
            <div className="mt-4 rounded-lg border border-border/50 bg-background/40 p-4">
              <p className="text-sm text-muted-foreground">
                Need another confirmation email for <span className="text-foreground">{confirmationEmail}</span>?
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => sendConfirmationEmail(confirmationEmail)}
              >
                Resend Confirmation Email
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
