import { redirect } from 'next/navigation';

export default function MapsPage() {
  redirect('/railyard/browse?type=map');
}
