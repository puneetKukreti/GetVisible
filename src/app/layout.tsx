import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeadForge AI - Website Agency Lead & Pipeline OS',
  description: 'Discover legitimate business leads, analyze digital presence, and manage client pipelines with strict anti-spam and compliance safeguards.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}
