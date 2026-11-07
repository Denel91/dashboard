import type { Metadata, Viewport } from 'next';
import './globals.css';

// Font di sistema (San Francisco su iPhone e Mac): lo imposta globals.css (D18).

export const metadata: Metadata = {
  title: 'Nucleo',
  description: 'Le spese di casa, divise in due. Sempre chiaro chi deve cosa.',
};

export const viewport: Viewport = {
  // Pagina fino ai bordi: tacca, isola dinamica e barra Home si gestiscono
  // con env(safe-area-inset-*) (linee guida iOS 27, sezione 5)
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f2f2f7' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="it" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
