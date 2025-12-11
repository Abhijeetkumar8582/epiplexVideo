import '../styles/globals.css'
import ErrorBoundary from '../components/ErrorBoundary'
import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { logPageView } from '../lib/activityLogger'

export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    // Log initial page view
    const logCurrentPage = () => {
      const pageName = router.pathname === '/' ? 'Home' : router.pathname.replace('/', '').replace('-', ' ') || 'Unknown'
      logPageView(pageName, {
        path: router.asPath,
        query: router.query
      })
    }

    // Log on mount
    logCurrentPage()

    // Log on route change
    const handleRouteChange = (url) => {
      const pathname = url.split('?')[0] // Remove query params
      const pageName = pathname === '/' ? 'Home' : pathname.replace('/', '').replace(/-/g, ' ') || 'Unknown'
      logPageView(pageName, {
        path: url,
        previousPath: router.asPath
      })
    }

    router.events.on('routeChangeComplete', handleRouteChange)

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])

  return (
    <>
      <Head>
        <html lang="en" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Head>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </>
  )
}

