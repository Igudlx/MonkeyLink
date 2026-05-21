export const metadata = { title: 'MonkeyLink Dashboard' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'Arial, sans-serif', background: '#0b0b0b', color: '#fff', margin: 0, padding: '2rem' }}>
        {children}
      </body>
    </html>
  );
}
