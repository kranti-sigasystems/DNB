"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
      <section className="min-h-screen bg-background px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl space-y-16 lg:space-y-20">
          {/* HEADER */}
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-5">
            <Badge className="bg-primary/10 text-primary">
              Contact Our Team
            </Badge>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Let’s Talk About Your
              <span className="block bg-gradient-to-br from-primary via-primary/60 to-primary/30 bg-clip-text text-transparent mt-2">
                Digital Negotiation Needs
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground">
              Whether you are looking for a product demo, enterprise onboarding,
              or support assistance, our team is ready to help you move forward.
            </p>
          </div>

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
            {/* LEFT – CONTACT DETAILS */}
            <div className="space-y-6 sm:space-y-8">
              <Card className="border shadow-sm sm:shadow-md rounded-2xl">
                <CardContent className="p-5 sm:p-6 space-y-6">
                  <ContactItem
                    icon={<Mail className="h-5 w-5" />}
                    title="Email"
                    description="Reach out for general inquiries or support"
                    value="support@digitalnegotiation.com"
                  />

                  <ContactItem
                    icon={<Phone className="h-5 w-5" />}
                    title="Phone"
                    description="Mon–Fri, 9 AM – 6 PM IST"
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

              {/* BUSINESS USE CASE */}
              <Card className="border bg-primary/5 shadow-sm sm:shadow-md rounded-2xl">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    <h3 className="text-lg font-semibold">
                      For Enterprises & Teams
                    </h3>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Bulk onboarding, advanced analytics, dedicated support, and
                    custom integrations tailored to your operations.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT – CONTACT FORM */}
            <Card className="border shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Send Us a Message</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5 sm:space-y-6">
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

                <Button size="lg" className="w-full h-12 gap-2">
                  Submit Inquiry
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* SUPPORT STRIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

/* --- Reusable Components --- */

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
      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-sm sm:text-base text-muted-foreground">{value}</p>
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
    <Card className="border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6 space-y-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm sm:text-base text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
