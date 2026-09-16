import React from 'react';
import { LeadStatus, WebsiteStatus } from '@/types';
import { Badge } from './badge';
import {
  Sparkles,
  Search,
  CheckCircle2,
  FileCode2,
  Clock,
  Send,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ShieldAlert,
  FileText,
  Award,
  XCircle,
  Globe,
  AlertTriangle,
  ShieldX,
  Smartphone,
  Check,
  HelpCircle,
} from 'lucide-react';

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  switch (status) {
    case 'NEW':
      return (
        <Badge variant="outline" className="gap-1 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5">
          <Sparkles className="w-3 h-3" /> New
        </Badge>
      );
    case 'RESEARCHING':
      return (
        <Badge variant="outline" className="gap-1 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5">
          <Search className="w-3 h-3" /> Researching
        </Badge>
      );
    case 'QUALIFIED':
      return (
        <Badge variant="outline" className="gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
          <CheckCircle2 className="w-3 h-3" /> Qualified
        </Badge>
      );
    case 'DEMO_GENERATED':
      return (
        <Badge variant="outline" className="gap-1 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/5">
          <FileCode2 className="w-3 h-3" /> Demo Ready
        </Badge>
      );
    case 'OUTREACH_PENDING':
      return (
        <Badge variant="outline" className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5">
          <Clock className="w-3 h-3" /> Approval Needed
        </Badge>
      );
    case 'CONTACTED':
      return (
        <Badge variant="outline" className="gap-1 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5">
          <Send className="w-3 h-3" /> Contacted
        </Badge>
      );
    case 'REPLIED':
      return (
        <Badge variant="outline" className="gap-1 border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/5">
          <MessageSquare className="w-3 h-3" /> Replied
        </Badge>
      );
    case 'INTERESTED':
      return (
        <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 font-semibold">
          <ThumbsUp className="w-3 h-3" /> Interested
        </Badge>
      );
    case 'NOT_INTERESTED':
      return (
        <Badge variant="outline" className="gap-1 border-zinc-500/30 text-zinc-500 dark:text-zinc-400 bg-zinc-500/5">
          <ThumbsDown className="w-3 h-3" /> Not Interested
        </Badge>
      );
    case 'DO_NOT_CONTACT':
      return (
        <Badge variant="destructive" className="gap-1 font-bold">
          <ShieldAlert className="w-3 h-3" /> DO NOT CONTACT
        </Badge>
      );
    case 'PROPOSAL':
      return (
        <Badge variant="outline" className="gap-1 border-violet-500/40 text-violet-700 dark:text-violet-300 bg-violet-500/10 font-medium">
          <FileText className="w-3 h-3" /> Proposal
        </Badge>
      );
    case 'CUSTOMER':
      return (
        <Badge variant="outline" className="gap-1 border-emerald-600 bg-emerald-600 text-white font-bold">
          <Award className="w-3 h-3" /> Customer
        </Badge>
      );
    case 'LOST':
      return (
        <Badge variant="outline" className="gap-1 border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5">
          <XCircle className="w-3 h-3" /> Lost
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function WebsiteStatusBadge({ status }: { status: WebsiteStatus }) {
  switch (status) {
    case 'NO_WEBSITE':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
          <AlertTriangle className="w-3.5 h-3.5" /> No Website
        </span>
      );
    case 'WEBSITE_EXISTS':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <Globe className="w-3.5 h-3.5" /> Website Exists
        </span>
      );
    case 'REQUIRES_REVIEW':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <Clock className="w-3.5 h-3.5" /> Requires Review
        </span>
      );
    case 'UNKNOWN':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <HelpCircle className="w-3.5 h-3.5" /> Status Unknown
        </span>
      );
    default:
      return <span className="text-xs text-muted-foreground">{status}</span>;
  }
}

export function OpportunityScoreBadge({ score }: { score: number }) {
  let colorClass = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  let tier = 'High';

  if (score < 50) {
    colorClass = 'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    tier = 'Low';
  } else if (score < 75) {
    colorClass = 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
    tier = 'Medium';
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colorClass}`}>
        {score}
      </span>
      <span className="text-[11px] text-muted-foreground">{tier}</span>
    </div>
  );
}
