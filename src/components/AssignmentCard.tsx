import { Assignment } from '@/types/assignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, FileText } from 'lucide-react';

interface AssignmentCardProps {
  assignment: Assignment;
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const productName = assignment['product_name'] || 'Untitled Product';
  const videoStyle = assignment['video_style'] || 'No style specified';
  const scriptName = assignment['script_name'] || '';
  const hasScript = scriptName.trim().length > 0;

  return (
    <Card className="assignment-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold leading-tight">
          {productName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="font-medium">
            {videoStyle}
          </Badge>
        </div>
        {hasScript && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {scriptName}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
