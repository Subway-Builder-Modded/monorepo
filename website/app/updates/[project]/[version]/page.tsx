import { permanentRedirect } from 'next/navigation';
import { getAllUpdateParams, getUpdateFilePath } from '@/lib/updates.server';
import { getUpdateProjectById } from '@/config/content/updates';

export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllUpdateParams();
}

export default async function LegacyUpdateRedirectPage({
  params,
}: {
  params: Promise<{ project: string; version: string }>;
}) {
  const { project: projectId, version } = await params;
  const project = getUpdateProjectById(projectId);
  if (!project) permanentRedirect('/');

  const filePath = getUpdateFilePath(projectId, version);
  if (!filePath) permanentRedirect(project.basePath);

  permanentRedirect(`/${projectId}/updates/${version}`);
}
