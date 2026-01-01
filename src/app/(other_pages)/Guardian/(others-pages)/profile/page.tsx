import UserAddressCard from "@/components/user-profile/UserKBSCred";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import { Metadata } from "next";
import React from "react";


export default function Profile() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5  lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800  lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          {/* <UserMetaCard />
          <UserInfoCard />
          <UserAddressCard /> */}
        </div>
      </div>
    </div>
  );
}
