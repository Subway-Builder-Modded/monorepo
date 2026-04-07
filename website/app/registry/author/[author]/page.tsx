import { redirect } from 'next/navigation';
import { loadRegistryAnalytics } from '@/lib/registry-analytics';

export const dynamicParams = false;
export const dynamic = 'force-static';

export async function generateStaticParams() {
  const data = loadRegistryAnalytics();
  const params = data.authors.map((authorRow) => ({
    author: authorRow.author,
  }));
  if (params.length > 0) return params;
  return [{ author: '__registry-data-unavailable__' }];
}

export default async function RegistryAuthorSingularRedirect({
  params,
}: {
  params: Promise<{ author: string }>;
}) {
  const { author } = await params;
  redirect(`/registry/authors/${encodeURIComponent(author)}`);
}
