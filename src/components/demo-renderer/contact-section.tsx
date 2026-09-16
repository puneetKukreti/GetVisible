'use client';

import React, { useState } from 'react';
import { WebsiteContent, WebsiteTheme } from '@/types';
import { Mail, Phone, AlertTriangle, CheckCircle, Send } from 'lucide-react';

interface ContactSectionProps {
  contact: WebsiteContent['contact'];
  theme: WebsiteTheme;
}

export function ContactSection({ contact, theme }: ContactSectionProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="inline-block rounded px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 mb-3">
            Inquiries
          </div>
          <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 ${
            theme.fontFamily === 'serif' ? 'font-serif' : 'font-sans'
          }`}>
            {contact.sectionTitle}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            {contact.sectionSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start max-w-5xl mx-auto">
          {/* Left Column: Direct Info */}
          <div className="lg:col-span-5 space-y-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Direct Inquiries
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              We welcome prospective corporate clients and business owners seeking proactive audit, direct tax, and GST advisory.
            </p>

            <div className="space-y-4 pt-2">
              {contact.publicEmail && (
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Official Email</div>
                    <a href={`mailto:${contact.publicEmail}`} className="font-semibold hover:underline">
                      {contact.publicEmail}
                    </a>
                  </div>
                </div>
              )}

              {contact.publicPhone && (
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Official Contact Number</div>
                    <a href={`tel:${contact.publicPhone}`} className="font-semibold hover:underline">
                      {contact.publicPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Prominent Simulated Form Notice */}
            <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Simulated Contact Demo:</strong>
                  <p className="mt-1 leading-normal text-amber-800 dark:text-amber-300">
                    {contact.simulatedDisclaimer}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Simulated Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-6 sm:p-8 shadow-xs">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">
                {contact.formTitle}
              </h3>

              {submitted ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 mb-3">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                    Demo Submission Simulated
                  </h4>
                  <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-300 max-w-sm mx-auto leading-relaxed">
                    This was a demonstration submission. In compliance with demo rules, no email, SMS, or external API message was transmitted.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', message: '' });
                    }}
                    className="mt-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold transition"
                  >
                    Reset Demo Form
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Adv. Rajesh Gupta"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Corporate Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="rajesh@company.example"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="+91-9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Inquiry Details
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Briefly describe your company structure or advisory requirements..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{contact.ctaSubmitText}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
