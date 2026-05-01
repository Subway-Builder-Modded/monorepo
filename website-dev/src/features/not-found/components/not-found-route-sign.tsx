import { SearchX } from "lucide-react";
import { NOT_FOUND_SIGN_CONTENT } from "@/config/not-found";

export function NotFoundRouteSign() {
  return (
    <div
      role="img"
      aria-labelledby="not-found-sign-title"
      className="mx-auto flex w-full max-w-[38rem] items-center gap-8 rounded-[1.875rem] bg-[#d71920] px-8 py-7 text-white shadow-sm sm:gap-10 sm:px-10 sm:py-8"
    >
      <span id="not-found-sign-title" className="sr-only">
        404 Not Found transit sign
      </span>

      <div className="flex shrink-0 items-center justify-center pl-1">
        <SearchX className="size-28 stroke-[1.75] sm:size-32" aria-hidden={true} />
      </div>

      <div className="flex min-h-[12rem] flex-1 flex-col items-center justify-center gap-3 text-center">
        <div
          className="text-[5.5rem] font-bold leading-none sm:text-[6.5rem]"
          style={{
            fontFamily: "Noto Sans SC, Microsoft YaHei, PingFang SC, Inter, Segoe UI, sans-serif",
          }}
        >
          {NOT_FOUND_SIGN_CONTENT.chineseLineName}
        </div>

        <div
          className="text-[3rem] font-bold leading-none sm:text-[3.5rem]"
          style={{ fontFamily: "Inter, Segoe UI, Helvetica Neue, Arial, sans-serif" }}
        >
          {NOT_FOUND_SIGN_CONTENT.lineName}
        </div>
      </div>
    </div>
  );
}
