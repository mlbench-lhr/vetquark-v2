
import Link from "next/link";

export const BoxProviderWithName = ({
  children,
  name,
  rightSideLink,
  rightSideLabel,
  className,
  noBorder = false,
  hFull = false,
  rightSideComponent,
  leftSideComponent,
  textClasses = " text-sm md:text-base font-semibold ",
}: {
  name?: string;
  rightSideLink?: string;
  rightSideLabel?: string;
  className?: string;
  textClasses?: string;
  children: React.ReactNode;
  noBorder?: Boolean;
  hFull?: Boolean;
  rightSideComponent?: React.ReactNode | React.ComponentType<any>;
  leftSideComponent?: React.ReactNode | React.ComponentType<any>;
}) => {
  const RightSideComponent = rightSideComponent;
  const LeftSideComponent = leftSideComponent;
  return (
    <div
      className={`${className} w-full flex flex-col justify-start items-start gap-2 ${!noBorder && "border-0 md:border"
        } rounded-2xl px-0 md:px-3.5 py-3`}
    >
      {(name || rightSideLink || leftSideComponent || rightSideComponent) && (
        <div className="flex justify-between w-full gap-y-2 flex-wrap-reverse items-start">
          {name && <h1 className={`${textClasses} leading-tight `}>{name}</h1>}

          {LeftSideComponent &&
            (typeof LeftSideComponent === "function" ? (
              <LeftSideComponent />
            ) : (
              LeftSideComponent
            ))}
          {RightSideComponent &&
            (typeof RightSideComponent === "function" ? (
              <RightSideComponent />
            ) : (
              RightSideComponent
            ))}
          {rightSideLink && (
            <Link
              href={rightSideLink}
              className="text-xs font-medium leading-tight text-primary underline mt-1 hover:no-underline text-end"
            >
              <h1>{rightSideLabel}</h1>
            </Link>
          )}
        </div>
      )}
      <div className={`w-full ${hFull && " h-full "}`}>{children}</div>
    </div>
  );
};
