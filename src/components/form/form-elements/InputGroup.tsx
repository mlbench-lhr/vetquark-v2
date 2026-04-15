"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Input from "../input/InputField";
import { EnvelopeIcon } from "../../../icons";
import PhoneInput from "../group-input/PhoneInput";

export default function InputGroup() {
  const { t } = useTranslation();
  const [phone, setPhone] = React.useState("");
  return (
    <ComponentCard title={t("common.inputGroup")}>
      <div className="space-y-6">
        <div>
          <Label>{t("common.emailLabel")}</Label>
          <div className="relative">
            <Input
              placeholder={t("common.email")}
              type="text"
              className="pl-[62px]"
            />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500  ">
              <EnvelopeIcon />
            </span>
          </div>
        </div>
        <div>
          <Label>{t("common.phoneLabel")}</Label>
          <PhoneInput
            placeholder={t("common.phonePlaceholder")}
            defaultCountry="us"
            value={phone}
            onChange={(next) => {
              setPhone(next);
              console.log("Updated phone number:", next);
            }}
          />
        </div>
      </div>
    </ComponentCard>
  );
}
