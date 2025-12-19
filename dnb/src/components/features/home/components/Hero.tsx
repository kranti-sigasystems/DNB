import { CheckCircle2, Sparkles, Star, Users, TrendingUp, Zap, Shield, Award } from 'lucide-react';
import { useState, useEffect } from 'react';

interface FloatingCard {
  id: number;
  y: number;
}

export default function Hero() {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [floatingCards, setFloatingCards] = useState<FloatingCard[]>([
    { id: 1, y: 0 },
    { id: 2, y: 0 },
  ]);

  useEffect(() => {
    setIsVisible(true);

    const interval = setInterval(() => {
      setFloatingCards((prev) =>
        prev.map((card) => ({
          ...card,
          y: Math.sin(Date.now() / 1000 + card.id) * 10,
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="w-full min-h-screen flex items-center bg-gradient-to-br from-background via-accent to-muted overflow-hidden">
      <div className="container mx-auto px-4 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className="space-y-6">
            {/* Trust Badge */}
            <div
              className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-card/80 backdrop-blur-sm rounded-full border border-border shadow-sm hover:shadow-md transition-all duration-300"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
                transition: 'all 0.6s ease-out',
              }}
            >
              <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-primary to-primary/80 rounded-full">
                <Award className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-primary">
                Trusted by 50,000+ professionals worldwide
              </span>
            </div>

            {/* Main Headline */}
            <div
              className="space-y-5"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
                transition: 'all 0.8s ease-out 0.2s',
              }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none">
                <span className="block text-foreground mb-2">Digital</span>
                <span className="block bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent pb-3">
                  Negotiation Book
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl font-normal">
                Transform your fish-selling business with intelligent negotiation tools. Streamline
                deals, optimize pricing, and close sales faster with real-time collaboration.
              </p>
            </div>

            {/* Feature Highlights */}
            <div
              className="cursor-pointer flex flex-wrap gap-3"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
                transition: 'all 1s ease-out 0.4s',
              }}
            >
              <div className="group flex items-center gap-2 px-4 py-2.5 bg-card/90 backdrop-blur-sm rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">Real-time Sync</span>
              </div>
              <div className="group flex items-center gap-2 px-4 py-2.5 bg-card/90 backdrop-blur-sm rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">Lightning Fast</span>
              </div>
              <div className="group flex items-center gap-2 px-4 py-2.5 bg-card/90 backdrop-blur-sm rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-foreground">Bank-level Security</span>
              </div>
            </div>

            {/* Stats Row */}
            <div
              className="grid grid-cols-3 gap-6 pt-8 border-t-2 border-border"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
                transition: 'all 1.4s ease-out 0.8s',
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">50K+</div>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Active Users</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">99.9%</div>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Uptime</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                    <Star className="w-5 h-5 text-white fill-white" />
                  </div>
                  <div className="text-3xl font-bold text-foreground">4.9</div>
                </div>
                <div className="text-sm text-muted-foreground font-medium">User Rating</div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div
            className="relative lg:block hidden"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(50px)',
              transition: 'all 1s ease-out 0.4s',
            }}
          >
            <div className="relative">
              {/* Floating card elements */}
              {floatingCards.map((card, index) => (
                <div
                  key={card.id}
                  className={`absolute z-10 w-22 h-22 rounded-2xl shadow-2xl flex items-center justify-center transform transition-all duration-300 ${
                    index === 0
                      ? '-top-12 -left-12 bg-card border-2 border-border hover:rotate-6'
                      : '-bottom-12 -right-12 bg-gradient-to-br from-purple-500 to-pink-600 hover:-rotate-6'
                  }`}
                  style={{
                    transform:
                      index === 0
                        ? `translateY(${card.y}px) rotate(6deg)`
                        : `translateY(${card.y}px) rotate(-6deg)`,
                  }}
                >
                  {index === 0 ? (
                    <div className="text-center p-3">
                      <div className="text-2xl font-bold bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent">
                        98%
                      </div>
                      <div className="text-sm font-semibold text-muted-foreground mt-1">Success Rate</div>
                    </div>
                  ) : (
                    <div className="text-center text-white p-3">
                      <div className="text-2xl font-bold">2.5x</div>
                      <div className="text-sm font-semibold mt-1 opacity-90">Faster Deals</div>
                    </div>
                  )}
                </div>
              ))}

              {/* Main image container */}
              <div className="relative bg-card rounded-3xl shadow-2xl overflow-hidden border-2 border-border transform hover:scale-105 transition-transform duration-500">
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/5/52/Liav%C3%A5g_plant.jpg"
                  alt="Digital Negotiation Platform Dashboard"
                  className="w-full h-auto object-cover"
                />

                {/* Overlay badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-foreground">Deal Closed</div>
                        <div className="text-sm text-muted-foreground font-medium">
                          ₹2,45,000 negotiated
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <span className="text-xl font-bold text-foreground">+15%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
