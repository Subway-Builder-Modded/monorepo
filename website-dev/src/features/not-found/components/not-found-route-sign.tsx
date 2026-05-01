import { SearchX } from "lucide-react";
import { NOT_FOUND_SIGN_CONTENT } from "@/config/not-found";

export function NotFoundRouteSign() {
  return (
    <div
      role="img"
      aria-labelledby="not-found-sign-title"
      className="mx-auto flex w-full max-w-[38rem] items-center gap-4 rounded-[1.875rem] bg-[#d71920] px-5 py-6 text-white shadow-sm sm:gap-10 sm:px-10 sm:py-8"
    >
      <span id="not-found-sign-title" className="sr-only">
        404 Not Found transit sign
      </span>

      <div className="flex shrink-0 items-center justify-center pl-1">
        <SearchX
          style={{ width: "clamp(4.5rem,18vw,8rem)", height: "clamp(4.5rem,18vw,8rem)" }}
          className="stroke-[1.75]"
          aria-hidden={true}
        />
      </div>

      <div className="flex min-h-[clamp(6rem,25vw,12rem)] flex-1 flex-col items-center justify-center gap-3 text-center">
        <div
          className="font-bold leading-none"
          style={{
            fontSize: "clamp(2.5rem,12vw,6.5rem)",
            fontFamily: "Noto Sans SC, Microsoft YaHei, PingFang SC, Inter, Segoe UI, sans-serif",
          }}
        >
          {NOT_FOUND_SIGN_CONTENT.chineseLineName}
        </div>

        <div
          className="font-bold leading-none"
          style={{
            fontSize: "clamp(1.5rem,6.5vw,3.5rem)",
            fontFamily: "Inter, Segoe UI, Helvetica Neue, Arial, sans-serif",
          }}
        >
          {NOT_FOUND_SIGN_CONTENT.lineName}
        </div>
      </div>
    </div>
  );
}
