import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
        {/* Top Section */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Digital Negotiation Book
            </h3>
            <p className="text-sm leading-relaxed">
              Building modern web solutions that scale. Your trusted tech
              partner.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="hover:text-white transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/integrations"
                  className="hover:text-white transition"
                >
                  Integrations
                </Link>
              </li>
              <li>
                <Link href="/api" className="hover:text-white transition">
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="hover:text-white transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/guides" className="hover:text-white transition">
                  Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:text-white transition"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Stay Updated</h3>
            <p className="text-sm">
              Subscribe to our newsletter to get the latest updates and offers.
            </p>

            <form className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Your email"
                className="w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" className="h-10 w-full sm:w-auto px-6">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 flex flex-col gap-6 border-t border-gray-700 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            © {currentYear} Digital Negotiation Book. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex justify-center sm:justify-end gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
            </Button>

            <Button variant="ghost" size="icon" asChild>
              <Link href="mailto:contact@yourcompany.com">
                <Mail className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
