// src/app/stats/page.tsx
import HasExpired from "@/components/HasExpired";
import HasNotRegisteredWrapper from "@/components/HasNotRegisteredWrapper";
import StatsRoutine from "@/components/StatsRoutine";

export default function LandingPageHome() {
  return (
    <HasNotRegisteredWrapper>
      <HasExpired>
        <StatsRoutine />
      </HasExpired>
    </HasNotRegisteredWrapper>
  );
}
