import { useSearchParams } from 'react-router-dom';
import { useMemo, useCallback, useState } from 'react';
import { useAssignments } from '@/hooks/useAssignments';
import { useFilmingProgress } from '@/hooks/useFilmingProgress';
import { AccountGroup } from '@/components/AccountGroup';
import { CompletionButton } from '@/components/CompletionButton';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { CreatorHub } from '@/components/CreatorHub';
import { RoleLandingPage } from '@/components/RoleLandingPage';
import { VADashboard } from '@/components/VADashboard';
import { CalendarDays, RefreshCw, Video, CheckCircle2, LayoutGrid, ClipboardList } from 'lucide-react';
import { Assignment } from '@/types/assignment';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role');
  const id = searchParams.get('id');
  const creatorId = searchParams.get('creator_id') || (role === 'creator' ? id : null);
  const vaId = role === 'va' ? id : null;

  // Determine which view to show
  // Backward compat: ?creator_id=xxx still works
  const isCreator = role === 'creator' || !!searchParams.get('creator_id');
  const isVA = role === 'va' && !!vaId;
  const showLanding = !isCreator && !isVA;

  if (showLanding) {
    return <RoleLandingPage />;
  }

  if (isVA && vaId) {
    return <VADashboard vaId={vaId} />;
  }

  // Creator dashboard (existing logic preserved 100%)
  return <CreatorDashboard creatorId={creatorId} />;
};

// Extracted existing creator dashboard into its own component
function CreatorDashboard({ creatorId }: { creatorId: string | null }) {
  const [activeTab, setActiveTab] = useState('hub');
  const [dayView, setDayView] = useState<'today' | 'yesterday'>('today');
  const { assignments, yesterdayAssignments, loading, error, refetch } = useAssignments(creatorId);
  
  const { isFilmed, toggleFilmed, filmedCount, allFilmed } = useFilmingProgress(
    creatorId, 
    assignments.length
  );

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const displayName = useMemo(() => {
    if (!creatorId) return null;
    return creatorId.charAt(0).toUpperCase() + creatorId.slice(1).toLowerCase();
  }, [creatorId]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const activeAssignments = dayView === 'today' ? assignments : yesterdayAssignments;

  const stats = useMemo(() => {
    const totalAssignments = activeAssignments.length;
    const uniqueProducts = new Set(activeAssignments.map(a => a['product_name'])).size;
    const accountCount = new Set(activeAssignments.map(a => a['account_name'])).size;
    return { totalAssignments, uniqueProducts, accountCount };
  }, [activeAssignments]);

  const { groupedAssignments, globalIndicesMap } = useMemo(() => {
    const groups: Record<string, Assignment[]> = {};
    const indices: Record<string, number[]> = {};
    
    activeAssignments.forEach((assignment, globalIndex) => {
      const accountName = assignment['account_name'] || 'Unknown';
      if (!groups[accountName]) {
        groups[accountName] = [];
        indices[accountName] = [];
      }
      groups[accountName].push(assignment);
      indices[accountName].push(globalIndex);
    });
    
    return { groupedAssignments: groups, globalIndicesMap: indices };
  }, [activeAssignments]);

  const sortedAccountNames = useMemo(() => {
    return Object.keys(groupedAssignments).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      return a.localeCompare(b);
    });
  }, [groupedAssignments]);

  const handleGoToAssignments = useCallback(() => {
    setActiveTab('assignments');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Creator Dashboard</h1>
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
          
          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hub" className="gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Hub
                </TabsTrigger>
                <TabsTrigger value="assignments" className="gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Assignments
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="assignments" className="mt-0">
            <div className="flex gap-2 mb-4">
              <Button
                variant={dayView === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDayView('today')}
              >
                Today
              </Button>
              <Button
                variant={dayView === 'yesterday' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDayView('yesterday')}
              >
                Yesterday
              </Button>
            </div>

            <div className="mb-6 pb-4 border-b border-border/50">
              <h2 className="text-2xl font-bold text-foreground">
                {dayView === 'today' ? 'My Assignments' : "Yesterday's Assignments"}
              </h2>
              {!loading && activeAssignments.length > 0 && (
                <>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have {stats.totalAssignments} total assignments {dayView === 'today' ? 'today' : 'from yesterday'} across {stats.accountCount} accounts using {stats.uniqueProducts} unique products
                  </p>
                  
                  {dayView === 'today' && (
                    <div className="mt-2 flex items-center gap-2">
                      {allFilmed ? (
                        <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">
                            All videos filmed! ✓ Ready to mark uploads complete
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Video className="h-3.5 w-3.5" />
                          <span className="text-xs">
                            📹 Filming progress: {filmedCount} of {stats.totalAssignments} completed
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {loading ? (
              <LoadingSkeleton />
            ) : error ? (
              <ErrorState message={error} />
            ) : activeAssignments.length === 0 ? (
              dayView === 'yesterday' ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <CalendarDays className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No assignments yesterday</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    There were no assignments scheduled for yesterday.
                  </p>
                </div>
              ) : (
                <EmptyState creatorId={creatorId} />
              )
            ) : (
              <div>
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

                {dayView === 'today' && <CompletionButton creatorId={creatorId} />}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hub" className="mt-0">
            <CreatorHub 
              creatorName={creatorId}
              assignments={assignments}
              onGoToAssignments={handleGoToAssignments}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default Index;
