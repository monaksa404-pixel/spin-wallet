import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NodeRequest, sendNodeResponse } from "srvx/node";

const serverEntry = "../dist/server/server.js" as string;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const m = await import(serverEntry);
  const server = m.default as { fetch: (input: Request) => Promise<Response> };
  const webReq = new NodeRequest({ req, res });
  const webRes = await server.fetch(webReq);
  await sendNodeResponse(res, webRes);
}
