import React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  icon: React.ElementType;
  gradient: string;
  buttonText: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    price: "€49",
    period: "/month",
    description: "Perfect for small teams getting started",
    icon: Sparkles,
    gradient: "from-blue-500 to-cyan-500",
    buttonText: "Start Free Trial",
    features: [
      "Up to 5 projects",
      "10 team members",
      "Basic document management",
      "Email support",
      "Mobile app access",
      "1GB storage",
    ],
  },
  {
    name: "Professional",
    price: "€149",
    period: "/month",
    description: "For growing construction companies",
    icon: Zap,
    gradient: "from-purple-500 to-pink-500",
    highlighted: true,
    badge: "Most Popular",
    buttonText: "Start Free Trial",
    features: [
      "Unlimited projects",
      "50 team members",
      "Advanced document workflows",
      "Priority support",
      "Mobile + Desktop apps",
      "50GB storage",
      "AI-powered scheduling",
      "Custom integrations",
      "Advanced analytics",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with custom needs",
    icon: Crown,
    gradient: "from-orange-500 to-red-500",
    buttonText: "Contact Sales",
    features: [
      "Unlimited everything",
      "Unlimited team members",
      "White-label solution",
      "24/7 dedicated support",
      "All platforms",
      "Unlimited storage",
      "AI + predictive analytics",
      "Custom development",
      "SLA guarantee",
      "On-premise deployment",
      "Advanced security",
    ],
  },
];

export const PremiumPricing: React.FC = () => {
  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
            Premium Pricing
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required. Cancel
            anytime.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => {
            const Icon = tier.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="relative"
              >
                {/* Popular badge */}
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-none shadow-lg px-4 py-1">
                      ⭐ {tier.badge}
                    </Badge>
                  </div>
                )}

                <div
                  className={`relative h-full rounded-2xl p-8 transition-all duration-300 ${
                    tier.highlighted
                      ? "bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-purple-950 border-2 border-purple-500 shadow-2xl shadow-purple-500/20"
                      : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${tier.gradient} mb-6`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Plan name */}
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {tier.name}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6">
                    {tier.description}
                  </p>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {tier.price}
                      </span>
                      {tier.period && (
                        <span className="text-muted-foreground">
                          {tier.period}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full mb-8 ${
                      tier.highlighted
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    } transition-all duration-300`}
                    size="lg"
                  >
                    {tier.buttonText}
                  </Button>

                  {/* Features */}
                  <div className="space-y-4">
                    {tier.features.map((feature, featureIndex) => (
                      <motion.div
                        key={featureIndex}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          delay: featureIndex * 0.05,
                          duration: 0.3,
                        }}
                        className="flex items-start gap-3"
                      >
                        <div
                          className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r ${tier.gradient} flex items-center justify-center mt-0.5`}
                        >
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm text-foreground">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Highlight glow effect */}
                  {tier.highlighted && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground mb-4">
            Need a custom solution? We've got you covered.
          </p>
          <Button variant="outline" size="lg" className="border-2">
            Schedule a Demo
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
