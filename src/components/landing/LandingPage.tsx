'use client';

import { Anchor, Ship, Bell, FileText, Wrench, Shield, Smartphone, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700">
      {/* Header */}
      <header className="px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Anchor className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Captain&apos;s Log</span>
          </div>
          <Link 
            href="/sign-in"
            className="px-4 py-2 bg-white text-teal-700 font-medium rounded-lg hover:bg-white/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-white/90 text-sm mb-6">
            <Ship className="w-4 h-4" />
            For boat owners who care about their vessel
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your Boat&apos;s Digital Logbook
          </h1>
          
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Track maintenance, manage documents, monitor costs, and never miss an important service date again.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-teal-700 font-semibold rounded-xl hover:bg-white/90 transition-colors shadow-lg"
            >
              Get Started Free
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-colors backdrop-blur"
            >
              Sign In
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="bg-white/10 backdrop-blur rounded-xl p-5">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1">Maintenance Tracking</h3>
              <p className="text-sm text-white/70">Track service intervals by date or engine hours</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-5">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1">Smart Alerts</h3>
              <p className="text-sm text-white/70">Get notified before services are due</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-5">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1">Document Storage</h3>
              <p className="text-sm text-white/70">Keep registrations, insurance, and manuals safe</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-5">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-1">Cost Tracking</h3>
              <p className="text-sm text-white/70">Monitor spending and maintenance history</p>
            </div>
          </div>

          {/* Install CTA */}
          <div className="mt-12 bg-white/10 backdrop-blur rounded-2xl p-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white">Install the App</h3>
                <p className="text-sm text-white/70">Works offline • No app store needed</p>
              </div>
            </div>
            <p className="text-sm text-white/60 text-left">
              Add Captain&apos;s Log to your home screen for quick access and offline capabilities.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-8 mt-12 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center text-white/60 text-sm">
          <p>© 2026 Captain&apos;s Log. Built for boat owners, by boat owners.</p>
          <p className="mt-2">🇦🇪 Made in UAE</p>
        </div>
      </footer>
    </div>
  );
}
