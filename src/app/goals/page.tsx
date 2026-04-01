import Goals from "@/components/Goals";
import HasNotRegisteredWrapper from "@/components/HasNotRegisteredWrapper";
import HasExpired from "@/components/HasExpired";

export default function Page() {
  return (
    <HasNotRegisteredWrapper>
      <HasExpired>
        <Goals />
      </HasExpired>
    </HasNotRegisteredWrapper>
  );
}