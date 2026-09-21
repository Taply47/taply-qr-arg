export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // QR REDIRECT + ESTADÍSTICAS
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

      // Obtener estadísticas actuales
      const statsKey = "STATS:" + qr;
      let stats = await env.QR_DB.get(statsKey, "json");

      if (!stats) {
        stats = {
          scans: 0,
          lastScan: null,
          lastDevice: null,
          lastIP: null
        };
      }

      // Datos del visitante
      const userAgent = request.headers.get("User-Agent") || "Desconocido";
      const ip =
        request.headers.get("CF-Connecting-IP") ||
        request.headers.get("X-Forwarded-For") ||
        "Desconocida";

      // Detectar dispositivo de forma simple
      const device = getDeviceName(userAgent);

      // Actualizar estadísticas
      stats.scans += 1;
      stats.lastScan = Date.now();
      stats.lastDevice = device;
      stats.lastIP = ip;

      // Guardar estadísticas
      await env.QR_DB.put(statsKey, JSON.stringify(stats));

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

      if (!qr) {
        return new Response("QR no especificado", { status: 400 });
      }

      const destino = await env.QR_DB.get(qr);

      // Obtener estadísticas
      const statsKey = "STATS:" + qr;
      const stats = await env.QR_DB.get(statsKey, "json");

      const scans = stats?.scans || 0;
      const lastScan = stats?.lastScan || null;
      const lastDevice = stats?.lastDevice || "Todavía no hay datos";
      const lastIP = stats?.lastIP || "Todavía no hay datos";

      let tiempoUltimo = "Nunca";

      if (lastScan) {
        tiempoUltimo = timeAgo(lastScan);
      }

      return new Response(`
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Consulta QR ${escapeHtml(qr)}</title>

<style>
* {
  box-sizing:border-box;
}

body {
  font-family:Arial,sans-serif;
  padding:20px;
  background:#f4f4f5;
  margin:0;
  color:#111;
}

.box {
  max-width:600px;
  margin:auto;
  background:white;
  padding:25px;
  border-radius:18px;
  box-shadow:0 4px 20px #0001;
}

h1 {
  margin-top:0;
}

.info {
  margin-top:15px;
  padding:16px;
  background:#f1f1f1;
  border-radius:12px;
}

.label {
  font-size:13px;
  color:#666;
  margin-bottom:5px;
}

.value {
  font-size:17px;
  font-weight:bold;
  word-break:break-word;
}

.url {
  font-size:15px;
  font-weight:normal;
}

.item {
  margin-bottom:18px;
}

.item:last-child {
  margin-bottom:0;
}

a {
  color:#111;
}

.back {
  display:block;
  margin-top:20px;
  text-align:center;
}
</style>
</head>

<body>

<div class="box">

<h1>🔎 QR ${escapeHtml(qr)}</h1>

${
  destino
    ? `
<div class="info">

<div class="item">
<div class="label">🔗 Página vinculada</div>
<div class="value url">${escapeHtml(destino)}</div>
</div>

<div class="item">
<div class="label">📊 Escaneos</div>
<div class="value">${scans}</div>
</div>

<div class="item">
<div class="label">🕐 Último escaneo</div>
<div class="value">${escapeHtml(tiempoUltimo)}</div>
</div>

<div class="item">
<div class="label">📱 Dispositivo</div>
<div class="value">${escapeHtml(lastDevice)}</div>
</div>

<div class="item">
<div class="label">🌐 IP</div>
<div class="value">${escapeHtml(lastIP)}</div>
</div>

</div>
`
    : `
<div class="info">
<p>❌ Este QR todavía no está configurado.</p>
</div>
`
}

<a class="back" href="/admin/panel?key=${encodeURIComponent(key)}">
← Volver al panel
</a>

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


// =========================
// DETECTAR DISPOSITIVO
// =========================
function getDeviceName(userAgent) {
  const ua = userAgent.toLowerCase();

  if (ua.includes("iphone")) {
    if (ua.includes("crios")) {
      return "iPhone — Chrome";
    }

    if (ua.includes("fxios")) {
      return "iPhone — Firefox";
    }

    return "iPhone — Safari";
  }

  if (ua.includes("ipad")) {
    return "iPad";
  }

  if (ua.includes("android")) {
    if (ua.includes("chrome")) {
      return "Android — Chrome";
    }

    if (ua.includes("firefox")) {
      return "Android — Firefox";
    }

    return "Android";
  }

  if (ua.includes("windows")) {
    if (ua.includes("edg")) {
      return "Windows — Edge";
    }

    if (ua.includes("chrome")) {
      return "Windows — Chrome";
    }

    if (ua.includes("firefox")) {
      return "Windows — Firefox";
    }

    return "Windows";
  }

  if (ua.includes("mac os")) {
    if (ua.includes("chrome")) {
      return "Mac — Chrome";
    }

    if (ua.includes("safari")) {
      return "Mac — Safari";
    }

    return "Mac";
  }

  if (ua.includes("linux")) {
    return "Linux";
  }

  return "Dispositivo desconocido";
}


// =========================
// TIEMPO DESDE EL ÚLTIMO ESCANEO
// =========================
function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 10) {
    return "Hace unos segundos";
  }

  if (seconds < 60) {
    return "Hace " + seconds + " segundos";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return "Hace " + minutes + (minutes === 1 ? " minuto" : " minutos");
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return "Hace " + hours + (hours === 1 ? " hora" : " horas");
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return "Hace " + days + (days === 1 ? " día" : " días");
  }

  const months = Math.floor(days / 30);

  return "Hace " + months + (months === 1 ? " mes" : " meses");
}


// =========================
// EVITA INYECCIÓN HTML
// =========================
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
