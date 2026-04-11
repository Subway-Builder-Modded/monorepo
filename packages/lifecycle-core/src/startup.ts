export interface StartupPhase<TName extends string = string> {
  name: TName;
  enabled: boolean;
  run: () => void | Promise<void>;
}

export function getPendingStartupPhases<TName extends string>(
  phases: readonly StartupPhase<TName>[],
  completed: ReadonlySet<TName>,
  running: ReadonlySet<TName>,
): StartupPhase<TName>[] {
  return phases.filter(
    (phase) => phase.enabled && !completed.has(phase.name) && !running.has(phase.name),
  );
}

export async function runStartupPhases<TName extends string>(
  phases: readonly StartupPhase<TName>[],
): Promise<TName[]> {
  const completed: TName[] = [];

  for (const phase of phases) {
    await phase.run();
    completed.push(phase.name);
  }

  return completed;
}