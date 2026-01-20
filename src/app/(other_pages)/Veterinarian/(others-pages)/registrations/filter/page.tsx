"use client";

import { ChevronLeft } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Species =
  | "Dog"
  | "Cat"
  | "Small Mammal"
  | "Bird"
  | "Reptile"
  | "Fish"
  | "Farm Animal"
  | "Other";

type Gender = "Male" | "Female";
type AgeRange = "1+" | "2+" | "5+" | "10+";
type LastExam = "1day" | "1week" | "1month";

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[36px] rounded-full px-5 text-[13px] font-medium transition-colors ${
        active ? "bg-[#3F78D8] text-white" : "bg-[#F5F6F6] text-[#111827]"
      }`}
    >
      {label}
    </button>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <FilterContent />
    </Suspense>
  );
}

function FilterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialSpecies = (searchParams.get("species") || "").trim();
  const initialGender = (searchParams.get("gender") || "").trim();
  const initialAge = (searchParams.get("age") || "").trim();
  const initialLastExam = (searchParams.get("lastExam") || "").trim();

  const [species, setSpecies] = useState<Species | null>(() => {
    const values: Species[] = [
      "Dog",
      "Cat",
      "Small Mammal",
      "Bird",
      "Reptile",
      "Fish",
      "Farm Animal",
      "Other",
    ];
    return values.includes(initialSpecies as Species)
      ? (initialSpecies as Species)
      : null;
  });

  const [gender, setGender] = useState<Gender | null>(() => {
    return initialGender === "Male" || initialGender === "Female"
      ? (initialGender as Gender)
      : null;
  });

  const [age, setAge] = useState<AgeRange | null>(() => {
    const values: AgeRange[] = ["1+", "2+", "5+", "10+"];
    return values.includes(initialAge as AgeRange) ? (initialAge as AgeRange) : null;
  });

  const [lastExam, setLastExam] = useState<LastExam | null>(() => {
    const values: LastExam[] = ["1day", "1week", "1month"];
    return values.includes(initialLastExam as LastExam)
      ? (initialLastExam as LastExam)
      : null;
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (species) params.set("species", species);
    else params.delete("species");
    if (gender) params.set("gender", gender);
    else params.delete("gender");
    if (age) params.set("age", age);
    else params.delete("age");
    if (lastExam) params.set("lastExam", lastExam);
    else params.delete("lastExam");
    return params.toString();
  }, [age, gender, lastExam, searchParams, species]);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          aria-label="Back"
        >
          <ChevronLeft className="h-6 w-6 text-[#111827]" />
        </button>
        <h1 className="text-[16px] font-medium leading-[20px] text-[#111827]">
          Filter
        </h1>
        <div className="h-10 w-10" />
      </div>

      <div className="px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+96px)]">
        <div className="text-[14px] font-medium leading-[18px] text-[#111827]">
          Select Species
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Chip label="Dog" active={species === "Dog"} onClick={() => setSpecies("Dog")} />
          <Chip label="Cat" active={species === "Cat"} onClick={() => setSpecies("Cat")} />
          <Chip
            label="Small Mammal"
            active={species === "Small Mammal"}
            onClick={() => setSpecies("Small Mammal")}
          />
          <Chip label="Bird" active={species === "Bird"} onClick={() => setSpecies("Bird")} />
          <Chip
            label="Reptile"
            active={species === "Reptile"}
            onClick={() => setSpecies("Reptile")}
          />
          <Chip label="Fish" active={species === "Fish"} onClick={() => setSpecies("Fish")} />
          <Chip
            label="Farm Animal"
            active={species === "Farm Animal"}
            onClick={() => setSpecies("Farm Animal")}
          />
          <Chip
            label="Other"
            active={species === "Other"}
            onClick={() => setSpecies("Other")}
          />
        </div>

        <div className="mt-6 text-[14px] font-medium leading-[18px] text-[#111827]">
          Gender
        </div>
        <div className="mt-3 flex gap-3">
          <Chip label="Male" active={gender === "Male"} onClick={() => setGender("Male")} />
          <Chip
            label="Female"
            active={gender === "Female"}
            onClick={() => setGender("Female")}
          />
        </div>

        <div className="mt-6 text-[14px] font-medium leading-[18px] text-[#111827]">
          Age (in years)
        </div>
        <div className="mt-3 flex gap-3">
          <Chip label="1+" active={age === "1+"} onClick={() => setAge("1+")} />
          <Chip label="2+" active={age === "2+"} onClick={() => setAge("2+")} />
          <Chip label="5+" active={age === "5+"} onClick={() => setAge("5+")} />
          <Chip label="10+" active={age === "10+"} onClick={() => setAge("10+")} />
        </div>

        <div className="mt-6 text-[14px] font-medium leading-[18px] text-[#111827]">
          Last Exam
        </div>
        <div className="mt-3 flex gap-3">
          <Chip
            label="1 day ago"
            active={lastExam === "1day"}
            onClick={() => setLastExam("1day")}
          />
          <Chip
            label="1 week ago"
            active={lastExam === "1week"}
            onClick={() => setLastExam("1week")}
          />
          <Chip
            label="1 month ago"
            active={lastExam === "1month"}
            onClick={() => setLastExam("1month")}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0px)] bg-white px-4 pb-4 pt-3">
        <button
          type="button"
          onClick={() => router.push(`/Veterinarian/registrations${queryString ? `?${queryString}` : ""}`)}
          className="h-[54px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white"
        >
          Show Results
        </button>
      </div>
    </div>
  );
}
