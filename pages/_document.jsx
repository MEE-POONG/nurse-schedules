import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="th">
      <Head>
        <meta name="application-name" content="ตารางเวร รพ.ครบุรี" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f766e" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ตารางเวร" />
        <meta name="mobile-web-app-capable" content="yes" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
