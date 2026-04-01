import AIRoutineBoard from "@/components/AIRoutineBoard";
import HasExpired from "@/components/HasExpired";
import HasNotRegisteredWrapper from "@/components/HasNotRegisteredWrapper";

export const metadata = {
  title: "AI Routine | My Daily Routine",
};

export default function AIRoutinePage() {
  return (
    <HasNotRegisteredWrapper>
      <HasExpired>
        <AIRoutineBoard />
      </HasExpired>
    </HasNotRegisteredWrapper>
  );
}
