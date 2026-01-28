import { Assignment } from '@/types/assignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, VolumeX } from 'lucide-react';

interface AssignmentCardProps {
  assignment: Assignment;
}

// Video style color mapping (case-insensitive)
function getVideoStyleColor(style: string): string {
  const normalizedStyle = style.toLowerCase().trim();
  
  switch (normalizedStyle) {
    case 'bof face':
      return 'bg-blue-500';
    case 'crying':
      return 'bg-purple-400';
    case "i'm so mad":
    case 'im so mad':
      return 'bg-red-500';
    case 'do not box':
      return 'bg-orange-500';
    case 'fit to be mad':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function AssignmentCard({ assignment }: AssignmentCardProps) {
  const productName = assignment['product_name'] || 'Untitled Product';
  const videoStyle = assignment['video_style'] || '';
  const scriptName = assignment['script_name'] || '';
  const assignmentOrder = assignment['assignment_order_active'] || '';
  
  const hasScript = scriptName.trim().length > 0;
  const hasVideoStyle = videoStyle.trim().length > 0;
  const hasOrder = assignmentOrder.trim().length > 0;

  return (
    <Card className="assignment-card relative overflow-hidden">
      {/* Order Badge - Top Right */}
      {hasOrder && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md">
            <span className="text-xs font-bold text-primary-foreground">
              #{assignmentOrder}
            </span>
          </div>
        </div>
      )}

      <CardHeader className="pb-2 pr-14">
        <CardTitle className="text-lg font-semibold leading-tight">
          {productName}
        </CardTitle>
        
        {/* Video Style Badge */}
        {hasVideoStyle && (
          <div className="mt-2">
            <span 
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getVideoStyleColor(videoStyle)}`}
            >
              {videoStyle}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2 pt-0">
        {/* Script Status */}
        {hasScript ? (
          <div className="flex items-start gap-2 p-2.5 bg-muted/50 rounded-md">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <span className="text-sm text-foreground">
                📄 Script: {scriptName}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-2.5 bg-muted/30 rounded-md border border-border/50">
            <VolumeX className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <span className="text-sm text-muted-foreground">
                🔇 Silent Video - No Script Needed
              </span>
              <p className="text-xs text-muted-foreground/70 mt-0.5">
                Film this video without voiceover or talking
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
