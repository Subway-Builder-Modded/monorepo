import { permanentRedirect } from 'next/navigation';
import {
  UPDATE_PROJECTS,
  getUpdateProjectById,
} from '@/config/content/updates';

export const dynamicParams = false;

export async function generateStaticParams() {
  return UPDATE_PROJECTS.map((p) => ({ project: p.id }));
}

export default async function LegacyProjectHubRedirectPage({
  params,
}: {
  params: Promise<{ project: string }>;
}) {
  const { project: projectId } = await params;
  const project = getUpdateProjectById(projectId);
  if (!project) {
    permanentRedirect(UPDATE_PROJECTS[0]?.basePath ?? '/');
  }

  permanentRedirect(project.basePath);
}
