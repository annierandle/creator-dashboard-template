import { useMemo, useState, useCallback } from 'react';
import { useVATasks, useVAPostingProgress } from '@/hooks/useVATasks';
import { VAAccountGroup } from '@/components/VAAccountGroup';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, RefreshCw, CheckCircle2, Smartphone } from 'lucide-react';

interface VADashboardProps {
  vaId: string;
}

export function VADashboard({ vaId }: VADashboardProps) {
  const { tasks, loading, error, refetch } = useVATasks(vaId);
  const { isPosted, togglePosted, postedCount, allPosted } = useVAPostingProgress(vaId, tasks.length);

  const [accountFilter, setAccountFilter] = useState('all');
  const [creatorFilter, setCreatorFilter] = useState('all');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const vaName = useMemo(() => {
    if (tasks.length > 0) {
      const name = tasks[0]['va_name'] || vaId;
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    return vaId.charAt(0).toUpperCase() + vaId.slice(1).toLowerCase();
  }, [tasks, vaId]);

  const accountNames = useMemo(() => {
    const names = new Set(tasks.map(t => t['account_name']).filter(Boolean));
    return Array.from(names).sort();
  }, [tasks]);

  const creatorNames = useMemo(() => {
    const names = new Set(tasks.map(t => t['creator_name']).filter(Boolean));
    return Array.from(names).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (accountFilter !== 'all' && task['account_name'] !== accountFilter) return false;
      if (creatorFilter !== 'all' && task['creator_name'] !== creatorFilter) return false;
      return true;
    });
  }, [tasks, accountFilter, creatorFilter]);

  // Group filtered tasks by account
  const accountGroups = useMemo(() => {
    const groups: Record<string, { tasks: typeof filteredTasks; globalIndices: number[]; videoNumbers: number[] }> = {};
    let videoCounter = 1;

    filteredTasks.forEach(task => {
      const originalIndex = tasks.indexOf(task);
      const account = task['account_name'] || 'Unknown';
      if (!groups[account]) {
        groups[account] = { tasks: [], globalIndices: [], videoNumbers: [] };
      }
      groups[account].tasks.push(task);
      groups[account].globalIndices.push(originalIndex);
      groups[account].videoNumbers.push(videoCounter);
      videoCounter++;
    });

    return groups;
  }, [filteredTasks, tasks]);

  const accountCount = accountNames.length;

  const handleRefresh = useCallback(() => refetch(), [refetch]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-bold text-foreground">VA Dashboard</h1>
              </div>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {/* Greeting & Progress */}
        <div className="mb-6 pb-4 border-b border-border/50">
          <h2 className="text-2xl font-bold text-foreground">
            Hi {vaName}!
          </h2>
          {!loading && tasks.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground mt-1">
                You have {tasks.length} video{tasks.length !== 1 ? 's' : ''} to post today across {accountCount} account{accountCount !== 1 ? 's' : ''}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {allPosted ? (
                  <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">All done for today! Excellent work!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-xs">
                      Posted: {postedCount} of {tasks.length} videos ({Math.round((postedCount / tasks.length) * 100)}%)
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        {!loading && tasks.length > 0 && (
          <div className="flex gap-3 mb-4 flex-wrap">
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="w-[160px]" aria-label="Filter by account">
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accountNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={creatorFilter} onValueChange={setCreatorFilter}>
              <SelectTrigger className="w-[160px]" aria-label="Filter by creator">
                <SelectValue placeholder="All Creators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Creators</SelectItem>
                {creatorNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Task List */}
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
            <p className="text-muted-foreground text-sm max-w-xs">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No videos to post today!</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Check back tomorrow for new posting tasks.
            </p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-muted-foreground text-sm">No tasks match your current filters.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => { setAccountFilter('all'); setCreatorFilter('all'); }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(accountGroups).map(([account, group]) => (
              <VAAccountGroup
                key={account}
                accountName={account}
                tasks={group.tasks}
                globalIndices={group.globalIndices}
                videoNumbers={group.videoNumbers}
                isPosted={isPosted}
                onTogglePosted={togglePosted}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
