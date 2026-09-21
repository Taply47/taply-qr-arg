export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // /q/001 → busca el destino del QR 001
    if (url.pathname.startsWith("/q/")) {
      const qr = url.pathname.split("/")[2];

      if (!qr) {
        return new Response("QR no especificado", { status: 400 });
      }

      const destino = await env.QR_DB.get(qr);

      if (!destino) {
        return new Response("Este QR todavía no está configurado", {
          status: 404
        });
      }

      return Response.redirect(destino, 302);
    }

    return new Response("Taply QR funcionando 🚀");
  }
};
