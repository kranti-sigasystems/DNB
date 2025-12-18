'use client';

import Plans from '@/components/features/home/components/Plan';

export default function PlansPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <Plans />
      </div>
    </div>
  );
}