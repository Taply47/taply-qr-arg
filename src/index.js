export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/q/001") {
      return Response.redirect("https://example.com", 302);
    }

    return new Response("Taply QR funcionando 🚀", {
      headers: {
        "content-type": "text/plain; charset=UTF-8"
      }
    });
  }
};
