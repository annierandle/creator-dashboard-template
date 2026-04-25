import { Assignment } from '@/types/assignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileText, VolumeX, Check, StickyNote, AlertTriangle, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Renders text with any URLs converted into clickable hyperlinks
function renderTextWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      // Reset regex state since we used .test on a global regex
      urlRegex.lastIndex = 0;
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface AssignmentCardProps {
  assignment: Assignment;
  index: number;
  isFilmed: boolean;
  onToggleFilmed: (index: number) => void;
  creatorId?: string;
  creatorName?: string;
  assignmentDate?: string;
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

export function AssignmentCard({ assignment, index, isFilmed, onToggleFilmed, creatorId, creatorName, assignmentDate }: AssignmentCardProps) {
  const productName = assignment['product_name'] || 'Untitled Product';
  const videoStyle = assignment['video_style'] || '';
  const scriptName = assignment['script_name'] || '';
  const scriptContent = assignment['script_content'] || '';
  const assignmentOrder = assignment['assignment_order'] || '';
  const notes = assignment['notes'] || '';
  const productLink = assignment['product_link'] || '';
  const accountName = (assignment as any)['account_name'] || '';

  // Persist "missing product" state per assignment (so it survives reload)
  const missingKey = `missing-product-${creatorId || 'anon'}-${assignmentDate || ''}-${productName}-${assignmentOrder}`;
  const replacementKey = `${missingKey}::replacement`;
  const reportIdKey = `${missingKey}::reportId`;
  const [isMissing, setIsMissing] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(missingKey) === '1';
  });
  const [submitting, setSubmitting] = useState(false);
  const [reportId, setReportId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(reportIdKey);
  });
  const [replacement, setReplacement] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(replacementKey) || '';
  });
  const [replacementDraft, setReplacementDraft] = useState<string>(replacement);
  const [savingReplacement, setSavingReplacement] = useState(false);
  const [undoing, setUndoing] = useState(false);
  
  // Check if script name is or contains a URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const scriptNameIsUrl = scriptName.trim().match(/^https?:\/\/[^\s]+$/);
  const hasScript = scriptName.trim().length > 0;
  const hasScriptContent = scriptContent.trim().length > 0;
  const hasVideoStyle = videoStyle.trim().length > 0;
  const hasOrder = assignmentOrder.trim().length > 0;
  const hasNotes = notes.trim().length > 0;
  const hasProductLink = productLink.trim().length > 0;

  const handleCheckboxChange = () => {
    onToggleFilmed(index);
  };

  const handleMissingToggle = async (checked: boolean) => {
    if (!checked || isMissing || submitting) return;
    setSubmitting(true);
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('missing_product_reports')
        .insert({
          creator_id: creatorId || null,
          creator_name: creatorName || null,
          account_name: accountName || null,
          product_name: productName,
          assignment_date: assignmentDate || null,
          video_style: videoStyle || null,
          assignment_order: assignmentOrder || null,
          notes: notes || null,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;

      // Fire alert email — don't block UX on this
      supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'missing-product-alert',
          recipientEmail: 'annie.e.randle@gmail.com',
          idempotencyKey: `missing-${missingKey}-${Date.now()}`,
          templateData: {
            creatorName: creatorName || 'Unknown creator',
            accountName,
            productName,
            assignmentDate,
            videoStyle,
            assignmentOrder,
            notes,
            reportedAt: new Date().toISOString(),
          },
        },
      }).catch((err) => console.error('Email alert failed', err));

      localStorage.setItem(missingKey, '1');
      if (inserted?.id) {
        localStorage.setItem(reportIdKey, inserted.id);
        setReportId(inserted.id);
      }
      setIsMissing(true);
      toast({
        title: 'Reported as missing',
        description: `Annie has been notified about "${productName}".`,
      });
    } catch (err) {
      console.error('Failed to report missing product', err);
      toast({
        title: 'Could not submit report',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveReplacement = async () => {
    const value = replacementDraft.trim();
    if (!value || savingReplacement) return;
    setSavingReplacement(true);
    try {
      if (reportId) {
        const { error } = await supabase
          .from('missing_product_reports')
          .update({ replacement_product: value })
          .eq('id', reportId);
        if (error) throw error;
      }
      localStorage.setItem(replacementKey, value);
      setReplacement(value);
      toast({
        title: 'Replacement noted',
        description: `Recorded "${value}" as the replacement.`,
      });
    } catch (err) {
      console.error('Failed to save replacement', err);
      toast({
        title: 'Could not save replacement',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingReplacement(false);
    }
  };

  const handleUndoMissing = async () => {
    if (!isMissing || undoing) return;
    setUndoing(true);
    try {
      if (reportId) {
        const { error } = await supabase
          .from('missing_product_reports')
          .update({
            resolved_at: new Date().toISOString(),
            resolution_note: 'Reversed by creator',
          })
          .eq('id', reportId);
        if (error) throw error;
      }

      // Fire reversal email
      supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'missing-product-reversal',
          recipientEmail: 'annie.e.randle@gmail.com',
          idempotencyKey: `missing-reversal-${missingKey}-${Date.now()}`,
          templateData: {
            creatorName: creatorName || 'Unknown creator',
            accountName,
            productName,
            assignmentDate,
            videoStyle,
            assignmentOrder,
            resolutionNote: replacement
              ? `Was replaced with: ${replacement}`
              : 'Reversed by creator',
            reversedAt: new Date().toISOString(),
          },
        },
      }).catch((err) => console.error('Reversal email failed', err));

      localStorage.removeItem(missingKey);
      localStorage.removeItem(replacementKey);
      localStorage.removeItem(reportIdKey);
      setIsMissing(false);
      setReplacement('');
      setReplacementDraft('');
      setReportId(null);
      toast({
        title: 'Report reversed',
        description: `Annie has been notified that "${productName}" is found.`,
      });
    } catch (err) {
      console.error('Failed to reverse report', err);
      toast({
        title: 'Could not reverse report',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUndoing(false);
    }
  };

  return (
    <Card 
      className={cn(
        "assignment-card relative overflow-hidden transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
        isFilmed && "opacity-60 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
        isMissing && "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800"
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
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg font-semibold leading-tight">
                {hasProductLink ? (
                  <a
                    href={productLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                  >
                    {productName}
                  </a>
                ) : (
                  productName
                )}
              </CardTitle>
              {hasNotes && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full text-[11px] font-medium hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors cursor-pointer shadow-sm border border-red-200/60 dark:border-red-700/40 shrink-0 whitespace-nowrap"
                      aria-label="View filming note"
                    >
                      <StickyNote className="h-3 w-3" />
                      filming note
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 max-h-64 overflow-y-auto" side="top" align="end">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm border-b pb-2">📝 Filming Note</h4>
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">{renderTextWithLinks(notes)}</p>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            
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
            {/* Script + Missing-product row (side-by-side when no script) */}
            <div className={cn("flex flex-col sm:flex-row gap-2", !hasScript && "items-stretch")}>
              {/* Script Status */}
              {hasScript ? (
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md flex-1">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                  {hasScriptContent ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button 
                          className="text-sm text-foreground text-left hover:text-primary hover:underline cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                          aria-label={`View script: ${scriptName}`}
                        >
                          📄 Script: {scriptNameIsUrl ? (
                            <a href={scriptName} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80" onClick={e => e.stopPropagation()}>{scriptName}</a>
                          ) : scriptName}
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
                            {renderTextWithLinks(scriptContent)}
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
                          📄 Script: {scriptNameIsUrl ? (
                            <a href={scriptName} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80" onClick={e => e.stopPropagation()}>{scriptName}</a>
                          ) : scriptName}
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
                <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-md border border-border/50 flex-1 min-w-0">
                  <VolumeX className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">🔇 No Script</span>
                </div>
              )}

              {/* Missing product report — compact, side-by-side with script when no script */}
              <button
                type="button"
                onClick={() => handleMissingToggle(!isMissing)}
                disabled={isMissing || submitting}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md border text-left text-sm transition-colors flex-1 min-w-0",
                  isMissing
                    ? "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 cursor-default"
                    : "bg-background border-border/60 text-muted-foreground hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-800 dark:hover:text-amber-200"
                )}
                aria-pressed={isMissing}
                aria-label={isMissing ? `Reported missing: ${productName}` : `Report missing: ${productName}`}
              >
                {isMissing ? (
                  <>
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span className="flex-1 font-medium truncate">Reported missing</span>
                  </>
                ) : (
                  <>
                    <Checkbox
                      checked={false}
                      className="h-4 w-4 pointer-events-none"
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">
                      {submitting ? 'Sending…' : "I don't have this product"}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Missing-state details: replacement + undo */}
            {isMissing && (
              <div className="space-y-2 p-2.5 rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                    Annie has been notified
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-amber-900 dark:text-amber-200 hover:bg-amber-200/60 dark:hover:bg-amber-900/40"
                    onClick={handleUndoMissing}
                    disabled={undoing}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {undoing ? 'Undoing…' : 'Undo'}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    value={replacementDraft}
                    onChange={(e) => setReplacementDraft(e.target.value)}
                    placeholder="Replaced with… (e.g. product name)"
                    className="h-8 text-sm bg-background"
                    maxLength={200}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={handleSaveReplacement}
                    disabled={
                      savingReplacement ||
                      !replacementDraft.trim() ||
                      replacementDraft.trim() === replacement
                    }
                  >
                    {savingReplacement
                      ? 'Saving…'
                      : replacement && replacement === replacementDraft.trim()
                      ? 'Saved'
                      : 'Save'}
                  </Button>
                </div>
                {replacement && (
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                    Currently saved: <span className="font-medium">{replacement}</span>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
