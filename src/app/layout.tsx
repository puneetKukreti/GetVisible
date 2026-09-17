import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GetVisible - Get your business seen online',
  description: 'GetVisible helps professional service firms and businesses build a modern, high-converting digital presence with personalized website concepts and human-in-the-loop sales workflows.',
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
