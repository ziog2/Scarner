import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const jakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Scarner — Report gratuito per auto e moto dalla targa',
  description:
    'Alternativa gratuita e trasparente ai report storici per auto e moto: verifica chilometraggio, revisioni, danni, classe ambientale, RCA e collegamenti ai portali ufficiali italiani.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="it" className={`${jakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
