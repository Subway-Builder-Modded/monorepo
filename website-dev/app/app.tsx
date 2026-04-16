import { SiteLayout } from "@/app/components/layout/site-layout";
import HomePage from "@/app/routes/home";

export default function App() {
  return (
    <SiteLayout>
      <HomePage />
    </SiteLayout>
  );
}
