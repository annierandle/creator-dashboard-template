import { Assignment } from '@/types/assignment';
import { AssignmentCard } from '@/components/AssignmentCard';
import { Building2 } from 'lucide-react';

interface AccountGroupProps {
  accountName: string;
  assignments: Assignment[];
}

export function AccountGroup({ accountName, assignments }: AccountGroupProps) {
  return (
    <div className="space-y-3">
      {/* Account Header */}
      <div className="bg-muted/50 rounded-lg px-4 py-3 border border-border/50">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">
            Account {accountName}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {assignments.length} assignment{assignments.length !== 1 ? 's' : ''} for today
        </p>
      </div>

      {/* Assignment Cards */}
      <div className="space-y-3 pl-2">
        {assignments.map((assignment, index) => (
          <AssignmentCard key={index} assignment={assignment} />
        ))}
      </div>
    </div>
  );
}
