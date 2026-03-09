import Head from 'next/head';
import { useRouter } from 'next/router';

export default function HomeValuePage({ data }: any) {
  const router = useRouter();
  const { slug } = router.query;

  return (
    <>
      <Head>
        <title>Home Value for {slug} - HomeValue Nova</title>
        <meta name="description" content={`Get your home value estimate for ${slug}`} />
      </Head>
      <main style={{ padding: '2rem' }}>
        <h1>Home Value Estimate: {slug}</h1>
        {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      </main>
    </>
  );
}

export async function getStaticProps({ params }: any) {
  return {
    props: { data: null },
    revalidate: 3600
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking'
  };
}
