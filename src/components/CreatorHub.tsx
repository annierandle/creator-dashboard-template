import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Assignment } from '@/types/assignment';
import { useHubResources } from '@/hooks/useHubResources';
import { useUpcomingAssignments } from '@/hooks/useUpcomingAssignments';
import { 
  CalendarDays, 
  CalendarCheck, 
  BookOpen, 
  Bell, 
  ExternalLink,
  Video,
  FileText,
  HelpCircle,
  Film,
  Gift,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreatorHubProps {
  creatorName: string | null;
  assignments: Assignment[];
  onGoToAssignments: () => void;
}

export function CreatorHub({ creatorName, assignments, onGoToAssignments }: CreatorHubProps) {
  const { updates, bonusOpportunities, loading: resourcesLoading } = useHubResources();
  const { upcomingDays, loading: upcomingLoading } = useUpcomingAssignments(creatorName);

  const displayName = useMemo(() => {
    if (!creatorName) return 'Creator';
    return creatorName.charAt(0).toUpperCase() + creatorName.slice(1).toLowerCase();
  }, [creatorName]);

  const stats = useMemo(() => {
    const totalAssignments = assignments.length;
    const uniqueProducts = new Set(assignments.map(a => a['product_name'])).size;
    const accountCount = new Set(assignments.map(a => a['account_name'])).size;
    return { totalAssignments, uniqueProducts, accountCount };
  }, [assignments]);

  // Resource links - Updated per requirements
  const resources = [
    { title: 'Filming Checklist', icon: CheckSquare, description: 'Step-by-step filming guide' },
    { title: 'Script Templates', icon: FileText, description: 'Standard script formats' },
    { title: 'Examples', icon: Film, description: 'Video style examples & reference accounts' },
    { title: 'FAQ & Help', icon: HelpCircle, description: 'Common questions answered' },
  ];

  // Format date for display (e.g., "Jan 30")
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {displayName}! 🎬
        </h2>
        <p className="text-muted-foreground mt-2">
          Your creator hub for everything you need
        </p>
      </div>

      {/* Grid Layout for Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Assignments Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onGoToAssignments}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Today's Assignments</CardTitle>
            </div>
            <CardDescription>Your work for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* FIX 1: Tight horizontal layout for number + "assignments" */}
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{stats.totalAssignments}</span>
                <span className="text-lg text-muted-foreground">assignments</span>
              </div>
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{stats.uniqueProducts} products</span>
                <span>•</span>
                <span>{stats.accountCount} accounts</span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2 gap-2">
                <ExternalLink className="h-4 w-4" />
                View Assignments
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Work Card - With real data */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Upcoming Work</CardTitle>
            </div>
            <CardDescription>Next 3 days preview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingLoading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : (
                upcomingDays.map((day, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <span className="text-sm text-foreground">{day.label}</span>
                    <div className="flex items-center gap-2">
                      {day.scheduled ? (
                        <span className="text-sm font-medium text-foreground">
                          {day.count} assignment{day.count !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">
                          Not yet scheduled
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bonus Opportunities Card - Dynamic from Hub_Resources */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">💰 Bonus Opportunities</CardTitle>
            </div>
            <CardDescription>Optional videos for extra earnings</CardDescription>
          </CardHeader>
          <CardContent>
            {resourcesLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : bonusOpportunities.length > 0 ? (
              <div className="space-y-3">
                {bonusOpportunities.slice(0, 1).map((bonus, index) => (
                  <div key={index} className="space-y-2">
                    <p className="text-sm font-medium text-foreground">{bonus.title}</p>
                    {bonus.content && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{bonus.content}</p>
                    )}
                    <div className="flex items-center justify-between">
                      {bonus.date_posted && (
                        <span className="text-xs text-muted-foreground/70">
                          Posted: {formatDate(bonus.date_posted)}
                        </span>
                      )}
                      {bonus.link && (
                        <a 
                          href={bonus.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          View Details →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Check back soon for bonus video opportunities and extra earning chances!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Resources Card - Updated */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Resources</CardTitle>
            </div>
            <CardDescription>Guides and references</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {resources.map((resource, index) => (
                <button
                  key={index}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-center"
                >
                  <resource.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">{resource.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Updates Card - Connected to Hub_Resources */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Updates</CardTitle>
            </div>
            <CardDescription>Recent announcements</CardDescription>
          </CardHeader>
          <CardContent>
            {resourcesLoading ? (
              <div className="text-sm text-muted-foreground">Loading updates...</div>
            ) : updates.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No recent updates - check back soon!
              </div>
            ) : (
              <div className="space-y-3">
                {updates.map((update, index) => (
                  <div key={index} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                    <div className="w-2 h-2 rounded-full mt-1.5 bg-primary" />
                    <div className="flex-1 min-w-0">
                      {update.link ? (
                        <a 
                          href={update.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-foreground hover:text-primary hover:underline transition-colors"
                        >
                          {update.title}
                        </a>
                      ) : (
                        <p className="text-sm font-medium text-foreground">{update.title}</p>
                      )}
                      {update.content && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {update.content}
                        </p>
                      )}
                      {update.date_posted && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {formatDate(update.date_posted)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
