import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WorkerWelcomeBannerProps {
  workerName: string;
  verificationStatus?: string;
}

export const WorkerWelcomeBanner: React.FC<WorkerWelcomeBannerProps> = ({
  workerName,
  verificationStatus = "Approved",
}) => {
  const isApproved = verificationStatus === "Approved";
  const isPending = verificationStatus === "Pending";

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {isApproved ? (
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold gap-1 rounded-md px-2.5 py-0.5"
              >
                <ShieldCheck className="size-3 text-emerald-500" />
                Verified Cooperative Gig Specialist
              </Badge>
            ) : isPending ? (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] font-semibold gap-1 rounded-md px-2.5 py-0.5"
              >
                <Clock className="size-3 text-amber-500" />
                Awaiting Cooperative Society Approval
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[11px] font-semibold gap-1 rounded-md px-2.5 py-0.5"
              >
                <AlertCircle className="size-3 text-rose-500" />
                Cooperative Verification Rejected
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Welcome back, {workerName}!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Here is your daily dispatch summary. Keep your online toggle active to automatically receive nearby cooperative gig requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link to="/worker/jobs">
            <Button className="rounded-lg h-9 px-3.5 text-xs font-semibold shadow-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground">
              <Briefcase className="size-3.5" />
              <span>Available Gigs</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
          <Link to="/worker/bookings">
            <Button
              variant="outline"
              className="rounded-lg h-9 px-3.5 text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Mission Control</span>
            </Button>
          </Link>
          <Link to="/worker/schedule">
            <Button
              variant="outline"
              className="rounded-lg h-9 px-3.5 text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
            >
              <Calendar className="size-3.5 text-accent" />
              <span>Schedule</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WorkerWelcomeBanner;
