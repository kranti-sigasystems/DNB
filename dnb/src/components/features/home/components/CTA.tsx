'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Building2, Network } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  bg: string;
  color: string;
}

export default function CTA() {
  const router = useRouter();

  const features: Feature[] = [
    {
      title: 'Launch Your Business Profile',
      description:
        'Set up your verified business page in minutes and start reaching customers instantly.',
      icon: <Building2 className="h-6 w-6" />,
      bg: 'bg-indigo-100',
      color: 'text-indigo-600',
    },
    {
      title: 'Track Growth & Performance',
      description:
        'Access smart dashboards and analytics to monitor leads, engagement, and conversions in real time.',
      icon: <BarChart3 className="h-6 w-6" />,
      bg: 'bg-emerald-100',
      color: 'text-emerald-600',
    },
    {
      title: 'Connect & Expand Network',
      description:
        'Collaborate with verified businesses, discover new partners, and grow your presence in the DNB network.',
      icon: <Network className="h-6 w-6" />,
      bg: 'bg-sky-100',
      color: 'text-sky-600',
    },
  ];

  return (
    <section className="w-full rounded-lg py-20 text-center text-gray-900">
      <h2 className="mb-4 text-4xl font-bold sm:text-5xl">Grow Your Business with DNB</h2>

      <p className="mb-12 text-lg text-gray-700 sm:text-xl">
        Create, manage, and promote your business — all from one powerful platform built for growth.
      </p>

      {/* Buttons */}
      <div className="mb-16 flex flex-col justify-center gap-4 sm:flex-row">
        <Button onClick={() => router.push('/')} className="button-styling">
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          onClick={() => router.push('/pricing')}
          className="rounded-lg border-[#16a34a] px-8 py-3 text-[#16a34a] transition-all duration-200 hover:bg-blue-50"
        >
          Learn More
        </Button>
      </div>

      {/* Feature Cards */}
      <div className="grid w-full grid-cols-1 gap-8 md:grid-cols-3 xl:gap-10">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-500 hover:shadow-blue-500/20"
          >
            <div
              className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${feature.bg} ${feature.color}`}
            >
              {feature.icon}
            </div>

            <h3 className="mb-3 text-xl font-bold text-gray-900">{feature.title}</h3>

            <p className="text-base text-gray-700">{feature.description}</p>
          </div>
        ))}
      </div>

      <p className="mt-16 text-sm text-gray-500">
        Build. Manage. Connect. Everything your business needs — all in one place with DNB.
      </p>
    </section>
  );
}
