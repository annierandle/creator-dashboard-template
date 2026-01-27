import { Assignment } from '@/types/assignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, FileText } from 'lucide-react';

interface AssignmentCardProps {
  assignment: Assignment;
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  return (
    <Card className="assignment-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold leading-tight">
          {assignment.product_name || 'Untitled Product'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="font-medium">
            {assignment.video_style || 'No style specified'}
          </Badge>
        </div>
        {assignment.script_required && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {assignment.script_name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
