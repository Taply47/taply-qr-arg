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
      return new Response(`
        <h1>Taply Admin 🚀</h1>

        <form action="/admin/save" method="GET">
          <label>QR:</label>
          <input name="qr" placeholder="001" required>
          <br><br>

          <label>Destino:</label>
          <input name="destino" placeholder="https://..." required>
          <br><br>

          <button>Guardar</button>
        </form>
      `, {
        headers: {
          "Content-Type": "text/html"
        }
      });
    }

    // Guardar QR
    if (url.pathname === "/admin/save") {
      const qr = url.searchParams.get("qr");
      const destino = url.searchParams.get("destino");

      if (!qr || !destino) {
        return new Response("Falta el QR o el destino", {
          status: 400
        });
      }

      await env.QR_DB.put(qr, destino);

      return new Response(`
        <h1>✅ QR guardado</h1>
        <p>QR: ${qr}</p>
        <p>Destino: ${destino}</p>
        <br>
        <a href="/admin">Volver al panel</a>
      `, {
        headers: {
          "Content-Type": "text/html"
        }
      });
    }

    return new Response("Taply QR funcionando 🚀");
  }
};
