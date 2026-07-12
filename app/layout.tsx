import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif-display',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Stylish Campus — Kampüs İkinci El Pazarı',
  description:
    'Üniversite öğrencileri için kampüs içi ikinci el eşya pazarı. Elden teslim, ödemesiz, güvenli.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-body bg-background text-foreground antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
