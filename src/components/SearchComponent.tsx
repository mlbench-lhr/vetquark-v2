import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useTranslation } from "react-i18next";

export const SearchComponent = ({
  searchQuery,
  onChangeFunc,
  width = " w-full sm:w-[325px] ",
  placeholder,
  searchButton = false,
  onClickAction,
}: {
  searchQuery: string;
  placeholder?: string;
  width?: string;
  onChangeFunc: React.Dispatch<React.SetStateAction<string>>;
  searchButton?: boolean;
  onClickAction?: any;
}) => {
  const { t } = useTranslation();
  const finalPlaceholder = placeholder ?? t("search.placeholder");
  return (
    <div
      className={`${width} ${searchButton ? "ps-3 rounded-[10px] h-[55px]" : "ps-2 rounded-[10px] h-[44px]"
        } relative border flex items-center justify-start text-black/50 overflow-hidden`}
    >
      <Search className="size-4 md:size-5" />
      <Input
        value={searchQuery}
        onChange={(e) => {
          onChangeFunc(e.target.value);
        }}
        className={`w-full ${searchButton ? "h-[53px]!" : "h-[44px]!"
          } border-none absolute top-0 left-0 ps-8 md:ps-10`}
        placeholder={finalPlaceholder}
      />
      {searchButton && onClickAction && (
        <Button
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${searchButton && "w-fit md:w-[130px]"
            }`}
          disabled={!searchQuery?.trim()}
          onClick={onClickAction}
        >
          {t("search.button")}
        </Button>
      )}
    </div>
  );
};
