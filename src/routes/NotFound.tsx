import { Link } from 'react-router-dom';
import { Card, EmptyState, PageHead } from '@/ui/components';

export function NotFound() {
  return (
    <>
      <PageHead title="Page not found" />
      <Card>
        <EmptyState emoji="🧭" title="Nothing here">
          <p>
            <Link to="/">Back to the dashboard</Link>
          </p>
        </EmptyState>
      </Card>
    </>
  );
}
