"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import CheckoutNavbar from "@/components/features/home/components/CheckoutNavbar";
import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Building2,
  Headphones,
  Briefcase,
} from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <CheckoutNavbar />
      <section className="min-h-screen bg-background px-6 py-20">
        <div className="mx-auto max-w-7xl space-y-20">
          {/* HEADER */}
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <Badge className="bg-primary/10 text-primary">
              Contact Our Team
            </Badge>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Let’s Talk About Your
              <span className="block bg-gradient-to-br from-primary via-primary/60 to-primary/30 bg-clip-text text-transparent pb-3">
                Digital Negotiation Needs
              </span>
            </h1>

            <p className="text-lg text-muted-foreground">
              Whether you are looking for a product demo, enterprise onboarding,
              or support assistance, our team is ready to help you move forward.
            </p>
          </div>

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
            {/* LEFT – CONTACT DETAILS */}
            <div className="space-y-8">
              <Card className="border shadow-md">
                <CardContent className="p-6 space-y-6">
                  <ContactItem
                    icon={<Mail className="h-5 w-5" />}
                    title="Email"
                    description="Reach out for general inquiries or support"
                    value="support@digitalnegotiation.com"
                  />

                  <ContactItem
                    icon={<Phone className="h-5 w-5" />}
                    title="Phone"
                    description="Business hours: Mon–Fri, 9 AM – 6 PM IST"
                    value="+91 98765 43210"
                  />

                  <ContactItem
                    icon={<MapPin className="h-5 w-5" />}
                    title="Office Location"
                    description="Registered business office"
                    value="Mumbai, India"
                  />
                </CardContent>
              </Card>

              {/* BUSINESS USE CASES */}
              <Card className="border bg-primary/5 shadow-md">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    <h3 className="text-lg font-semibold">
                      For Enterprises & Teams
                    </h3>
                  </div>
                  <p className="text-muted-foreground">
                    Contact us for bulk onboarding, advanced analytics,
                    dedicated support, and custom integrations tailored to your
                    business operations.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT – CONTACT FORM */}
            <Card className="border shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Your full name" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company / Business Name</Label>
                  <Input id="company" placeholder="ABC Fisheries Pvt Ltd" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Inquiry Type</Label>
                  <Input
                    id="purpose"
                    placeholder="Sales, Demo, Support, Enterprise"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Please describe your requirement in detail..."
                    className="min-h-[140px]"
                  />
                </div>

                <Button size="lg" className="w-full gap-2">
                  Submit Inquiry
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* SUPPORT STRIP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <SupportCard
              icon={<Briefcase className="h-6 w-6" />}
              title="Sales & Demo"
              description="Product walkthroughs and pricing discussions"
            />
            <SupportCard
              icon={<Headphones className="h-6 w-6" />}
              title="Customer Support"
              description="Technical help and account assistance"
            />
            <SupportCard
              icon={<Building2 className="h-6 w-6" />}
              title="Enterprise Solutions"
              description="Custom plans and integrations"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function ContactItem({
  icon,
  title,
  description,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

function SupportCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border shadow-md hover:shadow-lg transition-shadow">
      <CardContent className="p-6 space-y-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
