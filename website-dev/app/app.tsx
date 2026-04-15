import { SiteShell } from "@/app/components/shell/site-shell";
import HomePage from "@/app/routes/home";

export default function App() {
  return (
    <SiteShell>
      <HomePage />
    </SiteShell>
  );
}
