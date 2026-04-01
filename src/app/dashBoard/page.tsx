import DashBoard from "@/components/DashBoard";
import HasNotRegisteredWrapper from "@/components/HasNotRegisteredWrapper";
import HasExpired from "@/components/HasExpired";

export default function Page() {

  return (
    <HasNotRegisteredWrapper>
      <HasExpired>
        <DashBoard />
      </HasExpired>
    </HasNotRegisteredWrapper>
  )
}