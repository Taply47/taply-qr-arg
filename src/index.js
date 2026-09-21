export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // QR REDIRECT
    // =========================
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

    // =========================
    // LOGIN
    // =========================
    if (url.pathname === "/admin" && request.method === "GET") {
      return new Response(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Taply Admin</title>
<style>
body {
  font-family: Arial, sans-serif;
  background:#f4f4f5;
  margin:0;
  padding:20px;
}
.box {
  max-width:500px;
  margin:30px auto;
  background:white;
  padding:25px;
  border-radius:18px;
  box-shadow:0 4px 20px #0001;
}
h1 { margin-top:0; }
input, button {
  width:100%;
  box-sizing:border-box;
  padding:13px;
  margin-top:8px;
  border-radius:10px;
  border:1px solid #ccc;
  font-size:16px;
}
button {
  background:#111;
  color:white;
  cursor:pointer;
  border:0;
}
</style>
</head>
<body>
<div class="box">
<h1>Taply Admin 🚀</h1>

<form action="/admin/login" method="POST">
<input name="password" type="password" placeholder="Contraseña" required>
<button>Entrar</button>
</form>
</div>
</body>
</html>
`, {
        headers: { "Content-Type": "text/html; charset=UTF-8" }
      });
    }

    // =========================
    // LOGIN CHECK
    // =========================
    if (url.pathname === "/admin/login" && request.method === "POST") {
      const form = await request.formData();
      const password = form.get("password");
      const adminKey = await env.QR_DB.get("ADMIN_KEY");

      if (password !== adminKey) {
        return new Response("Contraseña incorrecta", { status: 401 });
      }

      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/admin/panel?key=" + encodeURIComponent(password)
        }
      });
    }

    // =========================
    // PANEL
    // =========================
    if (url.pathname === "/admin/panel") {
      const key = url.searchParams.get("key");
      const adminKey = await env.QR_DB.get("ADMIN_KEY");

      if (key !== adminKey) {
        return new Response("No autorizado", { status: 401 });
      }

      return new Response(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Taply Admin</title>

<style>
* { box-sizing:border-box; }

body {
  margin:0;
  font-family:Arial,sans-serif;
  background:#f4f4f5;
  color:#111;
}

header {
  background:#111;
  color:white;
  padding:20px;
}

header h1 {
  margin:0;
}

.container {
  max-width:700px;
  margin:auto;
  padding:15px;
}

.card {
  background:white;
  padding:20px;
  margin:15px 0;
  border-radius:18px;
  box-shadow:0 3px 15px #0001;
}

input, button {
  width:100%;
  padding:13px;
  margin-top:8px;
  border-radius:10px;
  border:1px solid #ccc;
  font-size:16px;
}

button {
  border:0;
  background:#111;
  color:white;
  cursor:pointer;
}

.result {
  margin-top:15px;
  padding:15px;
  background:#f1f1f1;
  border-radius:10px;
  word-break:break-all;
}

a {
  color:#555;
}
</style>
</head>

<body>

<header>
  <div class="container">
    <h1>Taply Admin 🚀</h1>
  </div>
</header>

<div class="container">

<!-- CONSULTAR QR -->
<div class="card">
<h2>🔎 Consultar QR</h2>

<form action="/admin/check" method="GET">
<input type="hidden" name="key" value="${escapeHtml(key)}">

<input
name="qr"
placeholder="Número del QR, ejemplo 001"
inputmode="numeric"
required
>

<button>Consultar</button>
</form>
</div>

<!-- GENERAR QRS -->
<div class="card">
<h2>🖨️ Generar QR</h2>

<p>Elegí desde qué número hasta qué número.</p>

<form action="/admin/generate" method="GET">

<input type="hidden" name="key" value="${escapeHtml(key)}">

<label>Desde</label>
<input
name="from"
type="number"
min="1"
max="9999"
value="1"
required
>

<label>Hasta</label>
<input
name="to"
type="number"
min="1"
max="9999"
value="100"
required
>

<button>Generar QRs</button>
</form>
</div>

<!-- ASIGNAR QR -->
<div class="card">
<h2>🔗 Asignar QR</h2>

<form action="/admin/save" method="POST">

<input type="hidden" name="key" value="${escapeHtml(key)}">

<input
name="qr"
placeholder="001"
inputmode="numeric"
required
>

<input
name="destino"
placeholder="https://instagram.com/..."
type="url"
required
>

<button>Guardar destino</button>

</form>
</div>

</div>

</body>
</html>
`, {
        headers: { "Content-Type": "text/html; charset=UTF-8" }
      });
    }

    // =========================
    // CONSULTAR QR
    // =========================
    if (url.pathname === "/admin/check") {
      const key = url.searchParams.get("key");
      const qr = url.searchParams.get("qr");
      const adminKey = await env.QR_DB.get("ADMIN_KEY");

      if (key !== adminKey) {
        return new Response("No autorizado", { status: 401 });
      }

      const destino = await env.QR_DB.get(qr);

      return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Consulta QR</title>
<style>
body{font-family:Arial;padding:20px;background:#f4f4f5}
.box{max-width:600px;margin:auto;background:white;padding:25px;border-radius:18px}
.url{background:#eee;padding:15px;border-radius:10px;word-break:break-all}
a{color:#111}
</style>
</head>
<body>
<div class="box">
<h1>QR ${escapeHtml(qr)}</h1>

${
  destino
    ? `<p>Actualmente apunta a:</p>
       <div class="url">${escapeHtml(destino)}</div>`
    : `<p>❌ Este QR todavía no está configurado.</p>`
}

<br>
<a href="/admin/panel?key=${encodeURIComponent(key)}">← Volver al panel</a>
</div>
</body>
</html>
`, {
        headers: { "Content-Type": "text/html; charset=UTF-8" }
      });
    }

    // =========================
    // GUARDAR QR
    // =========================
    if (url.pathname === "/admin/save" && request.method === "POST") {
      const form = await request.formData();

      const key = form.get("key");
      const qr = form.get("qr");
      const destino = form.get("destino");

      const adminKey = await env.QR_DB.get("ADMIN_KEY");

      if (key !== adminKey) {
        return new Response("No autorizado", { status: 401 });
      }

      if (!qr || !destino) {
        return new Response("Falta información", { status: 400 });
      }

      await env.QR_DB.put(qr, destino);

      return new Response(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:Arial;padding:20px;background:#f4f4f5}
.box{max-width:500px;margin:auto;background:white;padding:25px;border-radius:18px}
</style>
</head>
<body>
<div class="box">
<h1>✅ QR guardado</h1>
<p>QR: <b>${escapeHtml(qr)}</b></p>
<p>${escapeHtml(destino)}</p>
<a href="/admin/panel?key=${encodeURIComponent(key)}">Volver al panel</a>
</div>
</body>
</html>
`, {
        headers: { "Content-Type": "text/html; charset=UTF-8" }
      });
    }

    // =========================
    // GENERAR QRS PARA IMPRIMIR
    // =========================
    if (url.pathname === "/admin/generate") {
      const key = url.searchParams.get("key");
      const from = parseInt(url.searchParams.get("from"));
      const to = parseInt(url.searchParams.get("to"));

      const adminKey = await env.QR_DB.get("ADMIN_KEY");

      if (key !== adminKey) {
        return new Response("No autorizado", { status: 401 });
      }

      if (
        !Number.isInteger(from) ||
        !Number.isInteger(to) ||
        from < 1 ||
        to < from ||
        to - from > 499
      ) {
        return new Response(
          "Rango inválido. Máximo 500 QR por generación.",
          { status: 400 }
        );
      }

      let cards = "";

      for (let i = from; i <= to; i++) {
        const id = String(i).padStart(3, "0");
        const qrUrl =
          url.origin + "/q/" + id;

        const qrImage =
          "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" +
          encodeURIComponent(qrUrl);

        cards += `
<div class="qr">
  <img src="${qrImage}">
  <div>${id}</div>
</div>
`;
      }

      return new Response(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Taply QR ${from}-${to}</title>

<style>

body {
  font-family:Arial;
  margin:0;
  background:white;
}

.toolbar {
  padding:15px;
  background:#111;
  color:white;
  position:sticky;
  top:0;
  z-index:5;
}

button {
  padding:12px 20px;
  border:0;
  border-radius:10px;
  background:white;
  cursor:pointer;
}

.grid {
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:10px;
  padding:10px;
}

.qr {
  text-align:center;
  padding:8px;
  border:1px solid #ddd;
  break-inside:avoid;
}

.qr img {
  width:65%;
  max-width:110px;
  display:block;
  margin:auto;
}

.qr div {
  font-size:10px;
  margin-top:4px;
}

@media(max-width:600px) {
  .grid {
    grid-template-columns:repeat(3,1fr);
    gap:5px;
  }

  .qr img {
    width:80%;
  }
}

@media print {
  .toolbar {
    display:none;
  }

  .grid {
    grid-template-columns:repeat(5,1fr);
    gap:5px;
  }

  .qr {
    border:0;
  }
}

</style>
</head>

<body>

<div class="toolbar">
<button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
</div>

<div class="grid">
${cards}
</div>

</body>
</html>
`, {
        headers: { "Content-Type": "text/html; charset=UTF-8" }
      });
    }

    return new Response("Taply QR funcionando");
  }
};


// Evita que alguien pueda inyectar HTML en el panel
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
