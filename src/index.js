export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // QR
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

    // Panel
    if (url.pathname === "/admin") {
      return new Response(`
        <h1>Taply Admin</h1>

        <form action="/admin/login" method="POST">
          <input name="password" type="password" placeholder="Contraseña" required>
          <button>Entrar</button>
        </form>
      `, {
        headers: { "Content-Type": "text/html; charset=UTF-8" }
      });
    }

    // Login
    if (url.pathname === "/admin/login" && request.method === "POST") {
      const form = await request.formData();
      const password = form.get("password");
      const adminKey = await env.QR_DB.get("ADMIN_KEY");

      if (password !== adminKey) {
        return new Response("Contraseña incorrecta", { status: 401 });
      }

      return new Response(`
        <h1>Taply Admin</h1>

        <form action="/admin/save" method="POST">
          <input type="hidden" name="password" value="${password}">

          <label>QR:</label><br>
          <input name="qr" placeholder="001" required><br><br>

          <label>Destino:</label><br>
          <input name="destino" placeholder="https://..." required><br><br>

          <button>Guardar</button>
        </form>
      `, {
        headers: { "Content-Type": "text/html; charset=UTF-8" }
      });
    }

    // Guardar
    if (url.pathname === "/admin/save" && request.method === "POST") {
      const form = await request.formData();

      const password = form.get("password");
      const qr = form.get("qr");
      const destino = form.get("destino");

      const adminKey = await env.QR_DB.get("ADMIN_KEY");

      if (password !== adminKey) {
        return new Response("No autorizado", { status: 401 });
      }

      if (!qr || !destino) {
        return new Response("Falta el QR o el destino", { status: 400 });
      }

      await env.QR_DB.put(qr, destino);

      return new Response(`
        <h1>✅ QR guardado</h1>
        <p>QR: ${qr}</p>
        <p>Destino: ${destino}</p>
        <a href="/admin">Volver</a>
      `, {
        headers: { "Content-Type": "text/html; charset=UTF-8" }
      });
    }

    return new Response("Taply QR funcionando");
  }
};
