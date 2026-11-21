import type { SyncJob } from "@coach/shared";

export function jobTitle(job: Pick<SyncJob, "jobType">): string {
  return job.jobType === "historical" ? "Historical import" : "Recent sync";
}
