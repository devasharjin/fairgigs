import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, PlayCircle, CheckCircle2, Star, AlertTriangle, ArrowRight, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import {
  useWorkerStats,
  useAvailableGigs,
  useWorkerJobs,
  useWorkerProfile,
} from "@/features/worker/gigs/hooks";
import { Button } from "@/components/ui/button";
import { WorkerMetricCard } from "@/components/worker/common/WorkerMetricCard";
import { WorkerWelcomeBanner } from "@/components/worker/home/WorkerWelcomeBanner";
import { WorkerPriorityMission } from "@/components/worker/home/WorkerPriorityMission";
import { WorkerGuidelinesCard } from "@/components/worker/home/WorkerGuidelinesCard";

export const WorkerHome: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const { data: stats } = useWorkerStats();
  const { data: availableGigs = [] } = useAvailableGigs();
  const { data: myJobs = [] } = useWorkerJobs();
  const { data: profile } = useWorkerProfile();

  const registeredSkills = (profile?.skills || profile?.worker?.skills || []) as any[];
  const registeredSkillIds = registeredSkills
    .map((s) => (typeof s === "object" ? s?._id : s))
    .filter(Boolean)
    .map((id) => id.toString());

  const matchingAvailableGigs = registeredSkillIds.length > 0
    ? availableGigs.filter((gig) => {
        const gigServiceId = (gig.service?._id || gig.service)?.toString();
        return gigServiceId ? registeredSkillIds.includes(gigServiceId) : true;
      })
    : availableGigs;

  const activeJob = myJobs.find(
    (j) =>
      j.status === "CONFIRMED" ||
      j.status === "ASSIGNED" ||
      j.status === "IN_PROGRESS"
  );

  const verificationStatus =
    stats?.verificationStatus ||
    profile?.verificationStatus ||
    profile?.worker?.verificationStatus ||
    "Pending";
  const isApproved =
    stats?.verificationStatus === "Approved" ||
    stats?.isCooperativeApproved === true ||
    profile?.verificationStatus === "Approved" ||
    profile?.worker?.verificationStatus === "Approved";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Welcome Banner */}
      <WorkerWelcomeBanner
        workerName={user?.name?.split(" ")[0] || "Worker"}
        verificationStatus={verificationStatus}
      />

      {/* 1.2 Cooperative Verification Notice */}
      {!isApproved && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
            verificationStatus === "Rejected"
              ? "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-200"
              : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`size-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-md ${
                verificationStatus === "Rejected" ? "bg-rose-600" : "bg-amber-600"
              }`}
            >
              <ShieldAlert className="size-6 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-full ${
                    verificationStatus === "Rejected" ? "bg-rose-600" : "bg-amber-600"
                  }`}
                >
                  {verificationStatus === "Rejected"
                    ? "VERIFICATION REJECTED"
                    : "COOPERATIVE APPROVAL PENDING"}
                </span>
                <span className="text-xs font-semibold opacity-80">
                  {verificationStatus === "Rejected"
                    ? "Action required on credentials"
                    : "Under society committee review"}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                {verificationStatus === "Rejected"
                  ? "Your application was rejected by your cooperative society"
                  : "Awaiting approval from your affiliated cooperative society"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {verificationStatus === "Rejected"
                  ? "You cannot accept customer orders until your cooperative approves your credentials. Please contact your society administrator."
                  : "You can preview available gigs in your registered category, but customer order acceptance will unlock once approved by your cooperative."}
              </p>
            </div>
          </div>

          <Link to="/worker/profile" className="shrink-0 self-start sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl h-10 px-5 text-xs font-bold cursor-pointer transition-transform hover:scale-105"
            >
              <span>View Verification Profile</span>
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* 1.5 Emergency SOS Callout Banner */}
      {matchingAvailableGigs.some((g) => g.isEmergency) && (
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-rose-500/40 bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl ring-1 ring-rose-500/20">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="size-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg animate-pulse ring-2 ring-rose-400/40">
              <AlertTriangle className="size-6 text-white" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full">
                  🚨 URGENT SOS CALLOUT
                </span>
                <span className="text-xs text-rose-200 font-semibold">
                  {matchingAvailableGigs.filter((g) => g.isEmergency).length} nearby emergency awaiting responder
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Emergency callout: {matchingAvailableGigs.find((g) => g.isEmergency)?.service?.name} (₹{matchingAvailableGigs.find((g) => g.isEmergency)?.rate}/hr)
              </h3>
              <p className="text-xs text-rose-200/80">
                Customer Location: {matchingAvailableGigs.find((g) => g.isEmergency)?.address?.street || "Nearby"} • Immediate priority dispatch
              </p>
            </div>
          </div>

          <Link to="/worker/jobs" className="shrink-0 self-start sm:self-auto">
            <Button
              size="sm"
              className="rounded-xl h-10 px-5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg cursor-pointer transition-transform hover:scale-105"
            >
              <span>Claim Emergency SOS</span>
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <WorkerMetricCard
          label="Available Gigs"
          value={stats?.availableGigs ?? matchingAvailableGigs.length}
          subtitle="Waiting for pickup"
          icon={Sparkles}
          iconBgClass="bg-amber-500/10"
          iconColorClass="text-amber-500"
        />
        <WorkerMetricCard
          label="Active Work"
          value={`${stats?.activeJobs ?? 0} / ${stats?.weeklyServiceLimit ?? 6}`}
          subtitle={`Weekly quota (${stats?.weeklyServicesRemaining ?? Math.max(0, 6 - (stats?.activeJobs ?? 0))} left)`}
          icon={PlayCircle}
          iconBgClass="bg-blue-500/10"
          iconColorClass="text-blue-500"
        />
        <WorkerMetricCard
          label="Completed Jobs"
          value={stats?.totalJobsCompleted ?? 0}
          subtitle="All-time gigs fulfilled"
          icon={CheckCircle2}
          iconBgClass="bg-emerald-500/10"
          iconColorClass="text-emerald-500"
        />
        <WorkerMetricCard
          label="Rating"
          value={stats?.rating ? `${stats.rating.toFixed(1)} / 5.0` : "5.0 / 5.0"}
          subtitle="Customer satisfaction"
          icon={Star}
          iconBgClass="bg-amber-500/10"
          iconColorClass="text-amber-500"
        />
      </div>

      {/* 3. Priority Mission & Cooperative Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WorkerPriorityMission
            activeJob={activeJob}
            topAvailableGig={matchingAvailableGigs[0]}
          />
        </div>
        <div>
          <WorkerGuidelinesCard />
        </div>
      </div>
    </div>
  );
};

export default WorkerHome;