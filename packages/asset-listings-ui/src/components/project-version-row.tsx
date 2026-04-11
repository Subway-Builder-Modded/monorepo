import { ArrowDownToLine } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@subway-builder-modded/shared-ui';
import { cn } from '@subway-builder-modded/shared-ui';

import { formatProjectVersionDate } from '../lib/project-versions';

export interface ProjectVersionRowProps {
	version: string;
	prerelease: boolean;
	/** Shown below the version tag only when it differs from the version string. */
	name?: string;
	/** Shown as a game-requirements line when truthy. */
	gameVersion?: string;
	date: string;
	downloads: number;
	changelogHref: string;
	/** Platform-specific action slot (install button, deeplink button, etc.). */
	action: ReactNode;
	className?: string;
	/**
	 * Renders the changelog link element. Defaults to a plain `<a>`.
	 * Inject `<Link>` from Next.js or Wouter to get router-aware navigation.
	 */
	renderLink?: (
		href: string,
		className: string,
		children: ReactNode,
	) => ReactNode;
}

function defaultRenderLink(
	href: string,
	className: string,
	children: ReactNode,
): ReactNode {
	return (
		<a href={href} className={className}>
			{children}
		</a>
	);
}

export function ProjectVersionRow({
	version,
	prerelease,
	name,
	gameVersion,
	date,
	downloads,
	changelogHref,
	action,
	className,
	renderLink = defaultRenderLink,
}: ProjectVersionRowProps) {
	return (
		<div
			className={cn(
				'flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/30',
				className,
			)}
		>
			<div className="flex-1 min-w-0">
				{renderLink(
					changelogHref,
					'group inline-flex flex-col',
					<>
						<span className="flex items-center gap-2">
							<span className="text-sm font-semibold text-foreground group-hover:underline">
								{version}
							</span>
							{prerelease && (
								<Badge
									size="sm"
									className="border-amber-500/40 bg-amber-500/15 text-amber-600 dark:border-amber-400/40 dark:bg-amber-400/15 dark:text-amber-400"
								>
									Beta
								</Badge>
							)}
						</span>
						{name && (
							<span className="mt-0.5 text-xs text-muted-foreground truncate max-w-[20rem]">
								{name}
							</span>
						)}
					</>,
				)}
				{gameVersion && (
					<span className="mt-0.5 block text-xs text-muted-foreground">
						{gameVersion}
					</span>
				)}
			</div>

			<div className="w-[7rem] shrink-0 hidden sm:block">
				<span className="text-sm text-muted-foreground">
					{formatProjectVersionDate(date)}
				</span>
			</div>

			<div className="w-[6.5rem] shrink-0 hidden lg:flex items-center gap-1.5 text-sm text-muted-foreground">
				<ArrowDownToLine className="h-3.5 w-3.5" />
				{downloads.toLocaleString()}
			</div>

			<div className="hidden lg:block w-px self-stretch bg-border/50 mx-2" />
			<div className="w-[7rem] shrink-0 flex items-center justify-center">
				{action}
			</div>
		</div>
	);
}
