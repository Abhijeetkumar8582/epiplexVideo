import { useEffect } from 'react';
import { useRouter } from 'next/router';
import SEO from '../components/SEO';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Epiplex Document Processing',
    description: 'AI-powered video to document conversion platform',
    url: process.env.NEXT_PUBLIC_BASE_URL || 'https://epiplex.com',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };

  return (
    <>
      <SEO
        title="Home"
        description="Epiplex Document Processing - Transform videos into comprehensive documents with AI-powered transcription, keyframe extraction, and intelligent summarization."
        keywords="video processing, document conversion, AI transcription, video to document, keyframe extraction, video summarization"
        structuredData={structuredData}
      />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Redirecting...</p>
      </div>
    </>
  );
}
