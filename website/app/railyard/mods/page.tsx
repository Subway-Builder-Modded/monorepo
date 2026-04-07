import { redirect } from 'next/navigation';

export default function ModsPage() {
  redirect('/railyard/browse?type=mod');
}
