import { Assignment } from '@/types/assignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, VolumeX, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssignmentCardProps {
  assignment: Assignment;
  index: number;
  isFilmed: boolean;
  onToggleFilmed: (index: number) => void;
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

export function AssignmentCard({ assignment, index, isFilmed, onToggleFilmed }: AssignmentCardProps) {
  const productName = assignment['product_name'] || 'Untitled Product';
  const videoStyle = assignment['video_style'] || '';
  const scriptName = assignment['script_name'] || '';
  const scriptContent = assignment['script_content'] || '';
  const assignmentOrder = assignment['assignment_order'] || '';
  
  // Debug: Log assignment data
  console.log('Assignment card debug:', {
    index,
    productName,
    assignmentOrder,
    hasScriptContent: !!scriptContent.trim(),
    scriptContentPreview: scriptContent.substring(0, 50)
  });
  
  const hasScript = scriptName.trim().length > 0;
  const hasScriptContent = scriptContent.trim().length > 0;
  const hasVideoStyle = videoStyle.trim().length > 0;
  const hasOrder = assignmentOrder.trim().length > 0;

  const handleCheckboxChange = () => {
    onToggleFilmed(index);
  };

  return (
    <Card 
      className={cn(
        "assignment-card relative overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
        isFilmed && "opacity-60 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
      )}
    >
      {/* Order Badge - Top Right */}
      {hasOrder && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-primary flex items-center justify-center shadow-md">
            <span className="text-[10px] sm:text-sm font-bold text-primary-foreground">
              #{assignmentOrder}
            </span>
          </div>
        </div>
      )}

      {/* Filmed Indicator - Top Left when filmed */}
      {isFilmed && (
        <div className="absolute top-3 left-14 z-10">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white rounded-full text-xs font-medium">
            <Check className="h-3 w-3" />
            Filmed
          </div>
        </div>
      )}

      <div className="flex">
        {/* Checkbox Column */}
        <div className="flex items-center justify-center px-3 py-4 border-r border-border/50">
          <Checkbox
            checked={isFilmed}
            onCheckedChange={handleCheckboxChange}
            className="h-8 w-8 rounded-md border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            aria-label={`Mark ${productName} as filmed`}
          />
        </div>

        {/* Card Content */}
        <div className="flex-1">
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
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  {hasScriptContent ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button 
                          className="text-sm text-foreground text-left hover:text-primary hover:underline cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                          aria-label={`View script: ${scriptName}`}
                        >
                          📄 Script: {scriptName}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-80 max-h-64 overflow-y-auto"
                        side="top"
                        align="start"
                      >
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm border-b pb-2">
                            📄 {scriptName}
                          </h4>
                          <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                            {scriptContent}
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button 
                          className="text-sm text-foreground text-left hover:text-primary hover:underline cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                          aria-label={`View script: ${scriptName}`}
                        >
                          📄 Script: {scriptName}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent 
                        className="w-72"
                        side="top"
                        align="start"
                      >
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm border-b pb-2">
                            📄 {scriptName}
                          </h4>
                          <p className="text-sm text-muted-foreground italic">
                            Script text not available
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-md border border-border/50">
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
        </div>
      </div>
    </Card>
  );
}
