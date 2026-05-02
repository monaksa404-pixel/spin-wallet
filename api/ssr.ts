import type { VercelRequest, VercelResponse } from "@vercel/node";
import { NodeRequest, sendNodeResponse } from "srvx/node";

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const { default: server } = await import("../dist/server/server.js");
  const webReq = new NodeRequest({ req, res });
  const webRes = await server.fetch(webReq);
  await sendNodeResponse(res, webRes);
}
