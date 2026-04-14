import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { renderToReadableStream } from "react-dom/server";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  entryContext: EntryContext,
  _loadContext: AppLoadContext,
) {
  const body = await renderToReadableStream(
    <ServerRouter context={entryContext} url={request.url} />,
    {
      onError(error: unknown) {
        if (responseStatusCode === 200) responseStatusCode = 500;
        console.error(error);
      },
    },
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response(body, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
