import Image from "next/image";

export const NoDataComponent = ({
  text = "No Data Found",
  actionComponent,
}: {
  text: string;
  actionComponent?: React.ReactNode | React.ComponentType<any>;
}) => {
  const ActionComponent = actionComponent;
  return (
    <div
      className={`leading-tight text-xs md:text-base text-black/70 font-medium flex flex-col justify-center items-center gap-2`}
    >
      {/* <Image
        src={"/noDataFoundIcon.png"}
        width={220}
        height={220}
        alt="no-data"
        className="w-[120px] h-[120px] md:h-[220px] md:w-[220px] object-contain"
      /> */}
      {text}
      {ActionComponent &&
        (typeof ActionComponent === "function" ? (
          <ActionComponent />
        ) : (
          ActionComponent
        ))}
    </div>
  );
};
