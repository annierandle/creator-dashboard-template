import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useAssignments } from '@/hooks/useAssignments';
import { AccountGroup } from '@/components/AccountGroup';
import { CompletionButton } from '@/components/CompletionButton';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { CalendarDays, User } from 'lucide-react';
import { Assignment } from '@/types/assignment';

const Index = () => {
  const [searchParams] = useSearchParams();
  const creatorId = searchParams.get('creator_id');
  const { assignments, loading, error } = useAssignments(creatorId);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Group assignments by account_name
  const groupedAssignments = useMemo(() => {
    return assignments.reduce<Record<string, Assignment[]>>((groups, assignment) => {
      const accountName = assignment['account_name'] || 'Unknown';
      if (!groups[accountName]) {
        groups[accountName] = [];
      }
      groups[accountName].push(assignment);
      return groups;
    }, {});
  }, [assignments]);

  // Sort account names for consistent display
  const sortedAccountNames = useMemo(() => {
    return Object.keys(groupedAssignments).sort((a, b) => {
      // Try numeric sort if both are numbers
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [groupedAssignments]);

  const totalAssignments = assignments.length;

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
          <div>
            {/* Summary */}
            <p className="text-sm text-muted-foreground mb-6">
              {totalAssignments} assignment{totalAssignments !== 1 ? 's' : ''} across {sortedAccountNames.length} account{sortedAccountNames.length !== 1 ? 's' : ''}
            </p>

            {/* Account Groups */}
            <div className="space-y-6">
              {sortedAccountNames.map((accountName) => (
                <AccountGroup
                  key={accountName}
                  accountName={accountName}
                  assignments={groupedAssignments[accountName]}
                />
              ))}
            </div>

            {/* Completion Button */}
            <CompletionButton creatorId={creatorId} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
