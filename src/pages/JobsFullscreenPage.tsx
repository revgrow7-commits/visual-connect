import JobsKanban from "@/components/jobs/JobsKanban";
import PCPAgentChat from "@/components/jobs/PCPAgentChat";

const JobsFullscreenPage = () => (
  <div className="min-h-screen bg-[#0d1117] p-4">
    <JobsKanban />
    <PCPAgentChat />
  </div>
);

export default JobsFullscreenPage;
