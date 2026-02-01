import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Assignment } from '@/types/assignment';
import { 
  CalendarDays, 
  CalendarCheck, 
  BookOpen, 
  Bell, 
  ExternalLink,
  Video,
  TrendingUp,
  FileText,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreatorHubProps {
  creatorName: string | null;
  assignments: Assignment[];
  onGoToAssignments: () => void;
}

export function CreatorHub({ creatorName, assignments, onGoToAssignments }: CreatorHubProps) {
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

  // Mock data for upcoming work (in a real app, this would come from the CSV with date filtering)
  const upcomingDays = [
    { day: 'Tomorrow', count: Math.floor(Math.random() * 5) + 2 },
    { day: 'In 2 days', count: Math.floor(Math.random() * 4) + 1 },
    { day: 'In 3 days', count: Math.floor(Math.random() * 6) + 3 },
  ];

  // Resource links
  const resources = [
    { title: 'Filming Guidelines', icon: Video, description: 'Best practices for video creation' },
    { title: 'Script Templates', icon: FileText, description: 'Standard script formats' },
    { title: 'Brand Guidelines', icon: BookOpen, description: 'Style and brand requirements' },
    { title: 'FAQ & Help', icon: HelpCircle, description: 'Common questions answered' },
  ];

  // Recent updates/announcements
  const updates = [
    { title: 'New script format available', date: 'Jan 30', type: 'feature' },
    { title: 'Reminder: Submit by 5pm PST', date: 'Jan 29', type: 'reminder' },
    { title: 'February schedule published', date: 'Jan 28', type: 'info' },
  ];

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
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-foreground">{stats.totalAssignments}</span>
                <span className="text-sm text-muted-foreground">assignments</span>
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

        {/* Upcoming Work Card */}
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
              {upcomingDays.map((day, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-foreground">{day.day}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{day.count}</span>
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resources Card */}
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

        {/* Updates Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Updates</CardTitle>
            </div>
            <CardDescription>Recent announcements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {updates.map((update, index) => (
                <div key={index} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    update.type === 'feature' ? 'bg-green-500' :
                    update.type === 'reminder' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{update.title}</p>
                    <p className="text-xs text-muted-foreground">{update.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
