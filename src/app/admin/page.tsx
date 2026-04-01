// src/app/admin/page.tsx
import Admin from "@/components/Admin";
import HasNotRegisteredWrapper from "@/components/HasNotRegisteredWrapper";
import HasAdminWrapper from "@/components/HasAdminWrapper";

export default function Page() {
  return (
    <HasNotRegisteredWrapper>
      <HasAdminWrapper>
        <Admin />
      </HasAdminWrapper>
    </HasNotRegisteredWrapper>
  );
}
