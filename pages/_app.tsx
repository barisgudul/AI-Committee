// pages/_app.tsx (KONTROL EDİLECEK KOD)

// ↓↓↓ BU SATIRIN MEVCUT VE DOĞRU OLDUĞUNDAN EMİN OLUN ↓↓↓
import '../styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}