const variants: any = {
  upcoming: { text: "#008EFF" },
  "in-progress": { text: "#008EFF" },
  completed: { text: "#4A9E35" },
  Eligible: { text: "#4A9E35" },
  "Not Eligible": { text: "#F5A903" },
  pending: { text: "#FF862F" },
  cancelled: { text: "rgba(255, 0, 0, 0.60)" },
  missed: { text: "red" },
  active: { text: "#4A9E35" },
  Active: { text: "#4A9E35" },
  inactive: { text: "rgba(255, 0, 0, 0.60)" },
  Inactive: { text: "rgba(255, 0, 0, 0.60)" },
};
export const StatusText = ({ status }: { status: string }) => {
  return (
    <div
      className={`leading-tight text-xs md:text-base font-normal capitalize`}
      style={{
        color: variants[status]?.text,
      }}
    >
      {status}
    </div>
  );
};
