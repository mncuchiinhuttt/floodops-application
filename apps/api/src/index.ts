const API_VERSION = "v1";

export function createBootstrapHealthResponse(): Response {
  return Response.json({
    status: "bootstrap",
    api_version: API_VERSION
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/api/v1/health") {
      return createBootstrapHealthResponse();
    }

    return new Response("Not Found", { status: 404 });
  }
};

