import { Button } from '@/components/ui/button';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear: number = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 p-5 text-gray-400">
      <div className="mx-auto max-w-7xl py-16">
        {/* Top grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Company */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">Digital Negotiation Book</h3>
            <p className="text-sm text-gray-400">
              Building modern web solutions that scale. Your trusted tech partner.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Integrations
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  API
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Guides
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Stay Updated</h3>
            <p className="mb-4 text-sm text-gray-400">
              Subscribe to our newsletter to get the latest updates and offers.
            </p>

            <form className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                placeholder="Your email"
                className="w-full cursor-pointer rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
              />
              <Button
                type="submit"
                className="h-10 w-full cursor-pointer bg-[#16a34a] px-4 py-4 hover:bg-green-600 sm:w-auto"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 flex flex-col items-center justify-between border-t border-gray-700 pt-6 sm:flex-row">
          <p className="mb-4 text-sm text-gray-500 sm:mb-0">
            © {currentYear} Digital Negotiation Book. All rights reserved.
          </p>

          <div className="flex space-x-4">
            <Button variant="ghost" size="icon" asChild className="cursor-pointer">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5 text-blue-400 hover:bg-indigo-600" />
              </a>
            </Button>

            <Button variant="ghost" size="icon" asChild className="cursor-pointer">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <Twitter className="h-5 w-5 text-blue-400 hover:bg-indigo-600" />
              </a>
            </Button>

            <Button variant="ghost" size="icon" asChild className="cursor-pointer">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-5 w-5 text-blue-400 hover:bg-indigo-600" />
              </a>
            </Button>

            <Button variant="ghost" size="icon" asChild className="cursor-pointer">
              <a href="mailto:contact@yourcompany.com">
                <Mail className="h-5 w-5 text-blue-400 hover:bg-indigo-600" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
