"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CheckoutNavbar from "@/components/features/home/components/CheckoutNavbar";
import {
  CheckCircle2,
  CreditCard,
  Mail,
  LayoutDashboard,
  FileText,
  PackageCheck,
} from "lucide-react";

export default function OnboardingProcessPage() {
  return (
    <>
      <CheckoutNavbar />
      <section className="min-h-screen bg-background px-6 py-16">
        <div className="mx-auto max-w-6xl space-y-16">
          {/* HEADER */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <Badge className="bg-primary/10 text-primary">
              Account Setup Process
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Complete Your Onboarding
              <span className="block bg-gradient-to-br from-primary via-primary/60 to-primary/30 bg-clip-text text-transparent pb-3">
                Start Negotiating Digitally
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Follow the steps below to activate your account. Once completed,
              you’ll gain access to features based on your selected plan.
            </p>
          </div>

          {/* STEPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <StepCard
              step="Step 1"
              title="Choose a Plan"
              description="Select a subscription plan that matches your business scale. Each plan unlocks specific negotiation and analytics features."
              icon={<PackageCheck className="h-6 w-6" />}
            />

            <StepCard
              step="Step 2"
              title="Fill Business Details"
              description="Provide your business information to personalize dashboards, pricing insights, and reporting."
              icon={<FileText className="h-6 w-6" />}
            />

            <StepCard
              step="Step 3"
              title="Complete Secure Payment"
              description="Make a secure payment based on your selected plan. Billing is transparent with no hidden charges."
              icon={<CreditCard className="h-6 w-6" />}
            />

            <StepCard
              step="Step 4"
              title="Email Confirmation Sent"
              description="You’ll receive a confirmation email with account activation details and next steps."
              icon={<Mail className="h-6 w-6" />}
            />
          </div>

          {/* FINAL CTA */}
          <Card className="border shadow-xl rounded-2xl bg-primary/5">
            <CardContent className="p-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center">
                  <LayoutDashboard className="h-7 w-7" />
                </div>
              </div>

              <h2 className="text-2xl font-semibold">
                You’re Ready to Go Live
              </h2>

              <p className="text-muted-foreground max-w-2xl mx-auto">
                Once your email is verified, you can access your dashboard.
                Features such as smart negotiation, analytics, and team
                collaboration will be available based on your chosen plan.
              </p>

              <Button size="lg" className="gap-2">
                Go to Dashboard
                <CheckCircle2 className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

/* ----------------------------- */
/* Step Card Component */
/* ----------------------------- */

function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline">{step}</Badge>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </div>
        </div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
