// src/app/admin/page.tsx
import Admin from "@/components/AdminNew";
import HasAdminWrapper from "@/components/HasAdminWrapper";
import HasNotRegisteredWrapper from "@/components/HasNotRegisteredWrapper";

export default function Page() {
  return (
    <HasNotRegisteredWrapper>
      <HasAdminWrapper>
        <Admin />
      </HasAdminWrapper>
    </HasNotRegisteredWrapper>
  );
}
