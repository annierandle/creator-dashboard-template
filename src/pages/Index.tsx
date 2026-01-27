import { useSearchParams } from 'react-router-dom';
import { useAssignments } from '@/hooks/useAssignments';
import { AssignmentCard } from '@/components/AssignmentCard';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { CalendarDays, User } from 'lucide-react';

const Index = () => {
  const [searchParams] = useSearchParams();
  const creatorId = searchParams.get('creator_id');
  const { assignments, loading, error } = useAssignments(creatorId);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Assignments</h1>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{today}</span>
              </div>
            </div>
            {creatorId && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
                <User className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">{creatorId}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : assignments.length === 0 ? (
          <EmptyState creatorId={creatorId} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} for today
            </p>
            {assignments.map((assignment, index) => (
              <AssignmentCard key={index} assignment={assignment} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
