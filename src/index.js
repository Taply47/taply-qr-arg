export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // QR: /q/001
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

    // Panel de administración
if (url.pathname === "/admin") {
  return new Response(
    env.ADMIN_PASSWORD
      ? "ADMIN_PASSWORD está configurada correctamente"
      : "ADMIN_PASSWORD NO está configurada",
    { status: 200 }
  );

      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Taply Admin</title>
        </head>
        <body>
          <h1>Taply Admin 🚀</h1>
          <p>Panel funcionando correctamente.</p>
        </body>
        </html>
      `, {
        headers: {
          "Content-Type": "text/html"
        }
      });
    }

    return new Response("Taply QR funcionando 🚀");
  }
};
