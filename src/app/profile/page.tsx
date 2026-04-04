// src/app/profile/page.tsx
import HasNotRegisteredWrapper from "@/components/HasNotRegisteredWrapper";
import Profile from "@/components/Profile";

const ProfilePage = () => {
  return (
    <HasNotRegisteredWrapper>
      <Profile />
    </HasNotRegisteredWrapper>
  );
};

export default ProfilePage;
