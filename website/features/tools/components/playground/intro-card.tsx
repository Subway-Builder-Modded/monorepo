import { Card, CardDescription, CardHeader } from '@/components/ui/card';

export function PlaygroundIntroCard() {
  return (
    <Card className="relative z-10 border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="items-center text-center">
        <CardDescription className="w-full text-[0.98rem] leading-relaxed text-foreground/85">
          The Markdown Playground can be used to compose rich text (or markdown)
          and instantly export it as standard markdown or inline HTML. For
          Railyard submissions, the project description requires inline
          markdown/HTML, so you can use the inline output mode to generate the
          appropriate format.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
