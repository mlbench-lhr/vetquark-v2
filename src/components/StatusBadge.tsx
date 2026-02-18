const variants: any = {
  "created": { bg: "#F8E6D4", text: "#FF862F" },
  delivered: { bg: "#E7FAE3", text: "#4A9E35" },
  cancelled: { bg: "#FAE3E3", text: "#DE191D" }
};
export const StatusBadge = ({
  status,
  textClasses = " text-xs font-medium ",
  widthClasses = "w-fit",
}: {
  status: string;
  textClasses?: string;
  widthClasses?: string;
}) => {
  return (
    <div
      className={`px-2.5 py-1 leading-tight flex justify-center items-center ${textClasses} ${widthClasses} rounded-xl capitalize`}
      style={{
        color: variants[status]?.text,
        backgroundColor: variants[status]?.bg,
      }}
    >
      {status}
    </div>
  );
};
