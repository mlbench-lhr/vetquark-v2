import Header from "@/components/common/header";



export default function Profile() {
  return (
    <div className="min-h-screen bg-background p-6">
      <Header title="Menu" />
      <h3 className="mb-5 text-lg font-semibold text-gray-800  lg:mb-7">
        Profile
      </h3>
      <div className="space-y-6">
        {/* <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard /> */}
      </div>
    </div>
  );
}
