import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, Database, Lock, Palette, Rocket, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6" />
            <span className="text-lg font-semibold">Flywheel Starter</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-in">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Flywheel Starter
            <br />
            <span className="text-muted-foreground">Next.js + Supabase</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            A modern, production-ready starter template featuring Next.js 16,
            Supabase, TypeScript, and ShadCN UI. Start building your next
            project in minutes.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/auth/sign-in">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a
              href="https://github.com/flywheel-studio/nextjs-supabase-starter"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Features</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Everything you need to build modern web applications
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card>
              <CardHeader>
                <Lock className="mb-2 h-10 w-10" />
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  Complete Supabase Auth with server and client support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• JWT-based sessions</li>
                  <li>• Protected routes</li>
                  <li>• Email authentication</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card>
              <CardHeader>
                <Database className="mb-2 h-10 w-10" />
                <CardTitle>Database</CardTitle>
                <CardDescription>
                  PostgreSQL with RPC pattern for secure queries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• PostgreSQL functions</li>
                  <li>• Real-time subscriptions</li>
                  <li>• Type-safe queries</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card>
              <CardHeader>
                <Palette className="mb-2 h-10 w-10" />
                <CardTitle>UI Components</CardTitle>
                <CardDescription>
                  Beautiful components with ShadCN UI and Tailwind
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Dark/Light mode</li>
                  <li>• Responsive design</li>
                  <li>• Accessible</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card>
              <CardHeader>
                <Zap className="mb-2 h-10 w-10" />
                <CardTitle>Developer Tools</CardTitle>
                <CardDescription>
                  TypeScript, ESLint, Prettier, and Husky
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Git hooks automation</li>
                  <li>• Code quality checks</li>
                  <li>• Conventional commits</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card>
              <CardHeader>
                <Rocket className="mb-2 h-10 w-10" />
                <CardTitle>Production Ready</CardTitle>
                <CardDescription>
                  Optimized for performance and deployment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Server components</li>
                  <li>• Automatic releases</li>
                  <li>• SEO optimized</li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card>
              <CardHeader>
                <div className="mb-2 text-4xl">📚</div>
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Complete guides and examples</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Step-by-step tutorials</li>
                  <li>• Code examples</li>
                  <li>• Best practices</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Tech Stack</h2>
            <p className="mb-12 text-muted-foreground">
              Built with modern web technologies
            </p>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {[
                'Next.js 16',
                'Supabase',
                'TypeScript',
                'Tailwind CSS',
                'ShadCN UI',
                'Radix UI',
              ].map((tech) => (
                <div
                  key={tech}
                  className="rounded-lg border bg-card p-4 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to start?</h2>
            <p className="mb-8 text-muted-foreground">
              Clone the repository and start building your project today
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth/sign-in">
                <Button size="lg" className="w-full sm:w-auto">
                  Try Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a
                href="https://github.com/flywheel-studio/nextjs-supabase-starter"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Documentation
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              <span className="font-semibold">Flywheel Starter</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built by{' '}
              <a
                href="https://flywheel.so"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline"
              >
                Flywheel Studio
              </a>
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/auth/sign-in" className="hover:text-foreground">
                Sign In
              </Link>
              <a
                href="https://github.com/flywheel-studio/nextjs-supabase-starter"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                GitHub
              </a>
              <a
                href="https://github.com/flywheel-studio/nextjs-supabase-starter/blob/main/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
