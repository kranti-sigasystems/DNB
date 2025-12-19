import { ReactNode } from 'react';
import { Handshake, LayoutDashboard, Workflow, ShieldCheck, BarChart3, Users } from 'lucide-react';

/**
 * Feature card contract
 */
interface Feature {
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  bg: string;
}

export default function Features() {
  const features: Feature[] = [
    {
      title: 'Smart Deal Management',
      description:
        'Handle negotiations, offers, and counteroffers seamlessly through one unified platform.',
      icon: <Handshake className="h-6 w-6" />,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Centralized Dashboard',
      description:
        'Monitor all your business deals, clients, and payments in a single intuitive dashboard.',
      icon: <LayoutDashboard className="h-6 w-6" />,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      title: 'Automated Workflows',
      description:
        'Save hours of manual effort with automated processes for offers, approvals, and notifications.',
      icon: <Workflow className="h-6 w-6" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Secure Business Platform',
      description:
        'Built with enterprise-grade authentication and encryption to keep your negotiations private and protected.',
      icon: <ShieldCheck className="h-6 w-6" />,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      title: 'Real-Time Insights',
      description:
        'Access detailed analytics on deals, buyer activity, and performance to make data-driven decisions.',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
    {
      title: 'Multi-Role Access',
      description:
        'Empower your team with role-based access for admins, business owners, and buyers — all under one roof.',
      icon: <Users className="h-6 w-6" />,
      color: 'text-fuchsia-600',
      bg: 'bg-fuchsia-50',
    },
  ];

  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-16 text-center lg:mb-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Core Capabilities
          </p>
          <h2 className="text-4xl font-bold leading-tight text-foreground md:text-5xl">
            Designed for Modern Digital Teams
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-xl text-muted-foreground">
            Everything you need to build, deploy, and scale world-class applications, all in one
            place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:gap-10">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Subcomponents ---------- */

interface FeatureCardProps {
  feature: Feature;
}

function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <div
      className="group transform rounded-2xl border border-border bg-card p-6 shadow-xl
                 transition-all duration-500 ease-in-out hover:scale-[1.02]
                 hover:border-primary/50 hover:shadow-primary/20 md:p-8"
    >
      <div
        className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl ${feature.bg} ${feature.color}
                    transition-colors duration-300 group-hover:bg-opacity-80`}
      >
        {feature.icon}
      </div>

      <h3 className="mb-3 text-xl font-bold text-foreground">{feature.title}</h3>

      <p className="text-base text-muted-foreground">{feature.description}</p>
    </div>
  );
}
