"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import ComponentCard from "../../common/ComponentCard";
import Switch from "../switch/Switch";

export default function ToggleSwitch() {
  const { t } = useTranslation();
  const handleSwitchChange = (checked: boolean) => {
    console.log("Switch is now:", checked ? "ON" : "OFF");
  };
  return (
    <ComponentCard title={t("common.toggleSwitch")}>
      <div className="flex gap-4">
        <Switch
          label={t("common.defaultLabel")}
          defaultChecked={true}
          onChange={handleSwitchChange}
        />
        <Switch
          label={t("common.checkedLabel")}
          defaultChecked={true}
          onChange={handleSwitchChange}
        />
        <Switch label={t("common.disabledLabel")} disabled={true} />
      </div>{" "}
      <div className="flex gap-4">
        <Switch
          label={t("common.defaultLabel")}
          defaultChecked={true}
          onChange={handleSwitchChange}
          color="gray"
        />
        <Switch
          label={t("common.checkedLabel")}
          defaultChecked={true}
          onChange={handleSwitchChange}
          color="gray"
        />
        <Switch label={t("common.disabledLabel")} disabled={true} color="gray" />
      </div>
    </ComponentCard>
  );
}
