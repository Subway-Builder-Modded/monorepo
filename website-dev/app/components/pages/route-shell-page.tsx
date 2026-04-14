type RouteShellPageProps = {
  title: string;
};

export function RouteShellPage({ title }: RouteShellPageProps) {
  return (
    <section className="py-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
    </section>
  );
}
