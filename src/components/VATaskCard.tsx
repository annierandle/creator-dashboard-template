import { useState, useCallback } from 'react';
import { VATask } from '@/types/va-task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Copy, ExternalLink, Download, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VATaskCardProps {
  task: VATask;
  index: number;
  isPosted: boolean;
  onTogglePosted: (index: number) => void;
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase().trim()) {
    case 'posted':
      return 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30';
    case 'review_needed':
    case 'review needed':
      return 'bg-destructive/15 text-destructive border-destructive/30';
    case 'pending':
    default:
      return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
  }
}

function formatPostingDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function VATaskCard({ task, index, isPosted, onTogglePosted }: VATaskCardProps) {
  const [copied, setCopied] = useState(false);

  const productName = task['product_name'] || 'Untitled Product';
  const creatorName = task['creator_name'] || '';
  const accountName = task['account_name'] || '';
  const captionText = task['caption_text'] || '';
  const productLink = task['product_link'] || '';
  const videoFileLink = task['video_file_link'] || '';
  const postingDate = task['posting_date'] || '';
  const vaStatus = task['va_status'] || 'pending';
  const postingOrder = task['posting_order'] || '';

  const todayPST = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
  const isPostingToday = !postingDate || postingDate === todayPST;

  const handleCopyCaption = useCallback(async () => {
    if (!captionText) return;

    try {
      await navigator.clipboard.writeText(captionText);
      setCopied(true);
      toast({
        title: '✓ Caption copied to clipboard!',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      try {
        const textarea = document.createElement('textarea');
        textarea.value = captionText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        toast({ title: '✓ Caption copied to clipboard!' });
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast({
          title: 'Failed to copy caption',
          description: 'Please select and copy the text manually.',
          variant: 'destructive',
        });
      }
    }
  }, [captionText]);

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200 hover:shadow-lg',
        isPosted && 'opacity-60 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
      )}
    >
      {/* Posting Order Badge */}
      {postingOrder && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-md">
            <span className="text-sm font-bold text-primary-foreground">#{postingOrder}</span>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Checkbox Column */}
        <div className="flex items-start justify-center px-3 py-5 border-r border-border/50">
          <Checkbox
            checked={isPosted}
            onCheckedChange={() => onTogglePosted(index)}
            className="h-8 w-8 rounded-md border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            aria-label={`Mark ${productName} as posted`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <CardHeader className="pb-2 pr-14">
            <CardTitle className="text-xl font-semibold leading-tight">{productName}</CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              {creatorName && <span>By {creatorName}</span>}
              {creatorName && accountName && <span>•</span>}
              {accountName && <span>{accountName}</span>}
            </div>
            {!isPostingToday && (
              <p className="text-xs text-primary font-medium mt-1">
                Post on: {formatPostingDate(postingDate)}
              </p>
            )}
          </CardHeader>

          <CardContent className="space-y-3 pt-0">
            {/* Status Badge */}
            <Badge variant="outline" className={cn('text-xs', getStatusColor(vaStatus))}>
              {vaStatus}
            </Badge>

            {/* Caption Section */}
            {captionText && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">📝 Caption to Copy</p>
                <div className="border border-border rounded-md bg-muted/30 p-3 max-h-[150px] overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap text-foreground">{captionText}</p>
                </div>
                <Button
                  onClick={handleCopyCaption}
                  variant={copied ? 'outline' : 'default'}
                  size="sm"
                  className="w-full gap-2 min-h-[44px]"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      📋 Copy Caption
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {productLink && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 min-h-[44px]"
                  onClick={() => window.open(productLink, '_blank', 'noopener,noreferrer')}
                  aria-label="Open TikTok Shop Product"
                >
                  <ExternalLink className="h-4 w-4" />
                  🔗 Open TikTok Shop Product
                </Button>
              )}
              {videoFileLink && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 min-h-[44px]"
                  onClick={() => window.open(videoFileLink, '_blank', 'noopener,noreferrer')}
                  aria-label="Download Video"
                >
                  <Download className="h-4 w-4" />
                  📥 Download Video
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
