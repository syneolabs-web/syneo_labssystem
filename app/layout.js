import './styles/style.css';
import './styles/upgrade.css';

export const metadata = {
  title: 'SYNEO LAB — Where Creativity Meets Innovations',
  description: 'SYNEO LAB internal team workspace: projects, tasks, calendar, time tracking, leads, meetings and analytics.',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg'
  },
  // Internal company tool: keep it out of search engines.
  robots: { index: false, follow: false }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
