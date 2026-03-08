import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Check,
  AlertCircle,
  ExternalLink,
  Receipt,
  Crown,
  Sparkles,
  Building2,
  Calendar,
  ArrowRight,
  Loader2,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { stripeService } from '@/services/stripeService';
import { supabase } from '@/lib/supabase';

interface PaymentRecord {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  invoice_url?: string;
  description?: string;
}

interface SubscriptionInfo {
  plan: 'free' | 'professional' | 'enterprise';
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'suspended';
  expiresAt: string | null;
  trialEndsAt: string | null;
}

const PLAN_DETAILS = {
  free: {
    name: 'Starter',
    price: '0€',
    icon: Building2,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    features: ['1 Benutzer', '10 Projekte', '100 MB Speicher', 'Email Support'],
  },
  professional: {
    name: 'Professional',
    price: '29,99€',
    icon: Sparkles,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    features: ['10 Benutzer', '100 Projekte', '1 GB Speicher', 'Priority Support', 'Custom Branding'],
  },
  enterprise: {
    name: 'Enterprise',
    price: '99,99€',
    icon: Crown,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    features: ['Unlimited Benutzer', 'Unlimited Projekte', '10 GB Speicher', '24/7 Support', 'SLA 99.9%'],
  },
};

export default function BillingSettings() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    plan: 'free',
    status: 'active',
    expiresAt: null,
    trialEndsAt: null,
  });
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Check for success/cancel from Stripe redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast({
        title: 'Zahlung erfolgreich!',
        description: 'Ihr Abo wurde erfolgreich aktiviert.',
      });
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        title: 'Zahlung abgebrochen',
        description: 'Sie können jederzeit erneut ein Abo abschließen.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  // Load subscription and payment data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Get current user's tenant
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get tenant info from tenant_users
        const { data: tenantUser } = await supabase
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();

        if (tenantUser?.tenant_id) {
          setTenantId(tenantUser.tenant_id);

          // Get subscription status
          const subscriptionData = await stripeService.getSubscriptionStatus(tenantUser.tenant_id);
          if (subscriptionData) {
            setSubscription({
              plan: subscriptionData.plan as SubscriptionInfo['plan'],
              status: subscriptionData.status as SubscriptionInfo['status'],
              expiresAt: subscriptionData.expiresAt,
              trialEndsAt: subscriptionData.trialEndsAt,
            });
          }

          // Get payment history
          const paymentData = await stripeService.getPaymentHistory(tenantUser.tenant_id);
          setPayments(paymentData);
        }
      } catch (error) {
        console.error('Error loading billing data:', error);
        toast({
          title: 'Fehler',
          description: 'Abrechnungsdaten konnten nicht geladen werden.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [toast]);

  const handleUpgrade = async (plan: 'professional' | 'enterprise') => {
    if (!tenantId) {
      toast({
        title: 'Fehler',
        description: 'Tenant nicht gefunden.',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(`upgrade-${plan}`);
    try {
      await stripeService.redirectToCheckout({ tenantId, plan });
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Fehler',
        description: 'Upgrade konnte nicht gestartet werden.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    if (!tenantId) return;

    setActionLoading('portal');
    try {
      await stripeService.openCustomerPortal(tenantId);
    } catch (error) {
      console.error('Portal error:', error);
      toast({
        title: 'Fehler',
        description: 'Billing Portal konnte nicht geöffnet werden.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!tenantId) return;

    setActionLoading('cancel');
    try {
      const result = await stripeService.cancelSubscription(tenantId);
      if (result.success) {
        toast({
          title: 'Abo gekündigt',
          description: `Ihr Abo läuft noch bis ${new Date(result.cancelAt!).toLocaleDateString('de-DE')}.`,
        });
        setSubscription(prev => ({ ...prev, status: 'canceled' }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast({
        title: 'Fehler',
        description: 'Kündigung fehlgeschlagen.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
      setShowCancelDialog(false);
    }
  };

  const formatCurrency = (cents: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const currentPlanDetails = PLAN_DETAILS[subscription.plan];
  const PlanIcon = currentPlanDetails.icon;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PlanIcon className="h-5 w-5" />
                Aktueller Plan
              </CardTitle>
              <CardDescription>
                Verwalten Sie Ihr Abonnement und Ihre Zahlungsmethoden
              </CardDescription>
            </div>
            <Badge className={currentPlanDetails.color}>
              {currentPlanDetails.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Info */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{currentPlanDetails.price}<span className="text-sm font-normal text-muted-foreground">/Monat</span></p>
              {subscription.status === 'trialing' && subscription.trialEndsAt && (
                <p className="text-sm text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Testphase endet am {formatDate(subscription.trialEndsAt)}
                </p>
              )}
              {subscription.status === 'active' && subscription.expiresAt && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Nächste Abrechnung am {formatDate(subscription.expiresAt)}
                </p>
              )}
              {subscription.status === 'past_due' && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Zahlung überfällig - bitte Zahlungsmethode aktualisieren
                </p>
              )}
              {subscription.status === 'canceled' && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Abo gekündigt - läuft bis {subscription.expiresAt ? formatDate(subscription.expiresAt) : 'Periodenende'}
                </p>
              )}
            </div>
            {subscription.plan !== 'free' && (
              <Button 
                variant="outline" 
                onClick={handleManageBilling}
                disabled={actionLoading === 'portal'}
              >
                {actionLoading === 'portal' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Zahlungen verwalten
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Current Plan Features */}
          <div>
            <h4 className="font-medium mb-3">Enthaltene Features:</h4>
            <ul className="grid grid-cols-2 gap-2">
              {currentPlanDetails.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {subscription.plan !== 'enterprise' && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade Optionen</CardTitle>
            <CardDescription>
              Erweitern Sie Ihre Möglichkeiten mit einem besseren Plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Professional Plan */}
              {subscription.plan === 'free' && (
                <Card className="border-2 hover:border-blue-500 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        Professional
                      </CardTitle>
                      <Badge variant="secondary">Beliebt</Badge>
                    </div>
                    <p className="text-2xl font-bold">29,99€<span className="text-sm font-normal text-muted-foreground">/Monat</span></p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {PLAN_DETAILS.professional.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpgrade('professional')}
                      disabled={actionLoading === 'upgrade-professional'}
                    >
                      {actionLoading === 'upgrade-professional' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      14 Tage kostenlos testen
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Enterprise Plan */}
              <Card className="border-2 hover:border-purple-500 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-purple-600" />
                      Enterprise
                    </CardTitle>
                    <Badge className="bg-purple-100 text-purple-800">Premium</Badge>
                  </div>
                  <p className="text-2xl font-bold">99,99€<span className="text-sm font-normal text-muted-foreground">/Monat</span></p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {PLAN_DETAILS.enterprise.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700" 
                    onClick={() => handleUpgrade('enterprise')}
                    disabled={actionLoading === 'upgrade-enterprise'}
                  >
                    {actionLoading === 'upgrade-enterprise' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Upgrade zu Enterprise
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Zahlungsverlauf
            </CardTitle>
            <CardDescription>
              Ihre letzten Rechnungen und Zahlungen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div 
                  key={payment.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      payment.status === 'succeeded' ? 'bg-green-100 text-green-600' :
                      payment.status === 'failed' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {payment.status === 'succeeded' ? (
                        <Check className="h-4 w-4" />
                      ) : payment.status === 'failed' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {formatCurrency(payment.amount_cents, payment.currency)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                  </div>
                  {payment.invoice_url && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      asChild
                    >
                      <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Rechnung
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Subscription */}
      {subscription.plan !== 'free' && subscription.status !== 'canceled' && (
        <>
          <Separator />
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader>
              <CardTitle className="text-red-600">Abo kündigen</CardTitle>
              <CardDescription>
                Sie können Ihr Abo jederzeit kündigen. Es läuft bis zum Ende der aktuellen Abrechnungsperiode.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setShowCancelDialog(true)}
              >
                Abo kündigen
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abo wirklich kündigen?</AlertDialogTitle>
            <AlertDialogDescription>
              Ihr Abo wird zum Ende der aktuellen Abrechnungsperiode gekündigt. 
              Sie behalten bis dahin Zugriff auf alle Premium-Features.
              Nach Ablauf werden Sie automatisch auf den kostenlosen Plan heruntergestuft.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCancelSubscription}
              disabled={actionLoading === 'cancel'}
            >
              {actionLoading === 'cancel' && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Ja, Abo kündigen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
