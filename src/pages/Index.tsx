import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { useAssignments } from '@/hooks/useAssignments';
import { AccountGroup } from '@/components/AccountGroup';
import { CompletionButton } from '@/components/CompletionButton';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [searchParams] = useSearchParams();
  const creatorId = searchParams.get('creator_id');
  const { assignments, loading, error, refetch } = useAssignments(creatorId);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Capitalize creator name for display
  const displayName = useMemo(() => {
    if (!creatorId) return null;
    return creatorId.charAt(0).toUpperCase() + creatorId.slice(1).toLowerCase();
  }, [creatorId]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>{today}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
          
          {/* Personalized Welcome */}
          {displayName && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <h2 className="text-xl font-bold text-foreground">
                Hi {displayName}! 👋
              </h2>
              {!loading && assignments.length > 0 && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  You have {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} across {sortedAccountNames.length} account{sortedAccountNames.length !== 1 ? 's' : ''} today
                </p>
              )}
            </div>
          )}
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
