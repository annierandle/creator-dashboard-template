import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback } from 'react';
import { useAssignments } from '@/hooks/useAssignments';
import { useFilmingProgress } from '@/hooks/useFilmingProgress';
import { AccountGroup } from '@/components/AccountGroup';
import { CompletionButton } from '@/components/CompletionButton';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { CalendarDays, RefreshCw, Video, CheckCircle2 } from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [searchParams] = useSearchParams();
  const creatorId = searchParams.get('creator_id');
  const { assignments, loading, error, refetch } = useAssignments(creatorId);
  
  // Filming progress tracking
  const { isFilmed, toggleFilmed, filmedCount, allFilmed } = useFilmingProgress(
    creatorId, 
    assignments.length
  );

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

  // Calculate enhanced statistics
  const stats = useMemo(() => {
    const totalAssignments = assignments.length;
    const uniqueProducts = new Set(assignments.map(a => a['product_name'])).size;
    const accountCount = new Set(assignments.map(a => a['account_name'])).size;
    
    console.log('Stats calculated:', { totalAssignments, uniqueProducts, accountCount });
    
    return { totalAssignments, uniqueProducts, accountCount };
  }, [assignments]);

  // Group assignments by account_name with global indices
  const { groupedAssignments, globalIndicesMap } = useMemo(() => {
    const groups: Record<string, Assignment[]> = {};
    const indices: Record<string, number[]> = {};
    
    assignments.forEach((assignment, globalIndex) => {
      const accountName = assignment['account_name'] || 'Unknown';
      if (!groups[accountName]) {
        groups[accountName] = [];
        indices[accountName] = [];
      }
      groups[accountName].push(assignment);
      indices[accountName].push(globalIndex);
    });
    
    return { groupedAssignments: groups, globalIndicesMap: indices };
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
                <>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    You have {stats.totalAssignments} assignment{stats.totalAssignments !== 1 ? 's' : ''} for {stats.uniqueProducts} unique product{stats.uniqueProducts !== 1 ? 's' : ''} across {stats.accountCount} account{stats.accountCount !== 1 ? 's' : ''} today
                  </p>
                  
                  {/* Filming Progress */}
                  <div className="mt-2 flex items-center gap-2">
                    {allFilmed ? (
                      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          All videos filmed! ✓ Ready to mark uploads complete
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Video className="h-4 w-4" />
                        <span className="text-sm">
                          📹 Filming progress: {filmedCount} of {stats.totalAssignments} completed
                        </span>
                      </div>
                    )}
                  </div>
                </>
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
                  globalIndices={globalIndicesMap[accountName]}
                  isFilmed={isFilmed}
                  onToggleFilmed={toggleFilmed}
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
