export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================================================
    // QR REDIRECT
    // =========================================================

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

    // =========================================================
    // LINKTREE PUBLIC
    // /l/juan
    // =========================================================

    if (url.pathname.startsWith("/l/")) {
      const slug = url.pathname.split("/")[2];

      if (!slug) {
        return new Response("Perfil no especificado", { status: 400 });
      }

      const data = await env.QR_DB.get("profile:" + slug);

      if (!data) {
        return new Response("Este Linktree no existe", {
          status: 404
        });
      }

      let profile;

      try {
        profile = JSON.parse(data);
      } catch {
        return new Response("Perfil inválido", {
          status: 500
        });
      }

      const background =
        profile.theme === "dark" ? "#111111" : "#f5f5f5";

      const textColor =
        profile.theme === "dark" ? "#ffffff" : "#111111";

      const buttonBackground =
        profile.theme === "dark" ? "#242424" : "#ffffff";

      const buttonBorder =
        profile.theme === "dark" ? "#3a3a3a" : "#dddddd";

      const links = Array.isArray(profile.links)
        ? profile.links
        : [];

      const linksHTML = links.map(link => `
        <a
          class="link"
          href="${escapeHtml(link.url)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${escapeHtml(link.name)}
        </a>
      `).join("");

      const profileImage = profile.photo
        ? `
          <img
            class="profile"
            src="${escapeHtml(profile.photo)}"
            alt="Foto de perfil"
          >
        `
        : `
          <div class="profile placeholder">
            ${escapeHtml((profile.name || "T").charAt(0).toUpperCase())}
          </div>
        `;

      return new Response(`
<!DOCTYPE html>
<html lang="es">
<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1"
/>

<meta name="theme-color" content="${background}">

<title>${escapeHtml(profile.name || "Taply")}</title>

<style>

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  min-height: 100%;
}

body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    Arial,
    sans-serif;

  background: ${background};
  color: ${textColor};

  min-height: 100vh;
}

.page {
  width: 100%;
  max-width: 680px;
  margin: auto;
  padding: 40px 20px 30px;
  text-align: center;
}

.profile {
  width: 96px;
  height: 96px;

  object-fit: cover;

  border-radius: 50%;

  display: block;
  margin: 0 auto 16px;

  border: 3px solid ${buttonBackground};

  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;

  background: #222;
  color: white;

  font-size: 34px;
  font-weight: bold;
}

.name {
  font-size: 23px;
  font-weight: 700;

  margin-bottom: 25px;
}

.links {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.link {
  display: block;

  width: 100%;

  padding: 16px 18px;

  border-radius: 14px;

  background: ${buttonBackground};
  border: 1px solid ${buttonBorder};

  color: ${textColor};

  text-decoration: none;

  font-size: 16px;
  font-weight: 600;

  transition:
    transform 0.15s ease,
    opacity 0.15s ease;

  box-shadow: 0 3px 12px rgba(0,0,0,0.08);
}

.link:active {
  transform: scale(0.98);
}

.footer {
  margin-top: 30px;

  font-size: 13px;

  opacity: 0.55;
}

@media (min-width: 700px) {

  .page {
    padding-top: 60px;
  }

  .link:hover {
    transform: translateY(-2px);
  }

}

</style>

</head>

<body>

<div class="page">

  ${profileImage}

  <div class="name">
    ${escapeHtml(profile.name || "")}
  </div>

  <div class="links">
    ${linksHTML}
  </div>

  <div class="footer">
    Taply
  </div>

</div>

</body>
</html>
      `, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      });
    }

    // =========================================================
    // ADMIN LOGIN
    // =========================================================

    if (
      url.pathname === "/admin" &&
      request.method === "GET"
    ) {
      return new Response(`
<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
/>

<title>Taply Admin</title>

<style>

* {
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;

  background: #f4f4f5;

  margin: 0;
  padding: 20px;
}

.box {
  max-width: 500px;

  margin: 30px auto;

  background: white;

  padding: 25px;

  border-radius: 18px;

  box-shadow: 0 4px 20px #0001;
}

h1 {
  margin-top: 0;
}

input,
button,
select {
  width: 100%;

  box-sizing: border-box;

  padding: 13px;

  margin-top: 8px;

  border-radius: 10px;

  border: 1px solid #ccc;

  font-size: 16px;
}

button {
  background: #111;

  color: white;

  cursor: pointer;

  border: 0;
}

</style>

</head>

<body>

<div class="box">

<h1>Taply Admin</h1>

<form action="/admin/login" method="POST">

<input
  name="password"
  type="password"
  placeholder="Contraseña"
  required
>

<button>
Entrar
</button>

</form>

</div>

</body>

</html>
      `, {
        headers: {
          "Content-Type": "text/html; charset=UTF-8"
        }
      });
    }

    // =========================================================
    // LOGIN
    // =========================================================

    if (
      url.pathname === "/admin/login" &&
      request.method === "POST"
    ) {

      const form = await request.formData();

      const password = form.get("password");

      const adminKey =
        await env.QR_DB.get("ADMIN_KEY");

      if (password !== adminKey) {
        return new Response(
          "Contraseña incorrecta",
          { status: 401 }
        );
      }

      return new Response(null, {
        status: 302,

        headers: {
          "Location":
            "/admin/panel?key=" +
            encodeURIComponent(password)
        }
      });
    }

    // =========================================================
    // ADMIN PANEL
    // =========================================================

    if (url.pathname === "/admin/panel") {

      const key =
        url.searchParams.get("key");

      const adminKey =
        await env.QR_DB.get("ADMIN_KEY");

      if (key !== adminKey) {
        return new Response(
          "No autorizado",
          { status: 401 }
        );
      }

      return new Response(`
<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
/>

<title>Taply Admin</title>

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  font-family:
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Arial,
    sans-serif;

  background: #f4f4f5;

  color: #111;
}

header {

  background: #111;

  color: white;

  padding: 20px;
}

header h1 {
  margin: 0;
}

.container {

  max-width: 700px;

  margin: auto;

  padding: 15px;
}

.card {

  background: white;

  padding: 20px;

  margin: 15px 0;

  border-radius: 18px;

  box-shadow:
    0 3px 15px #0001;
}

input,
button,
select {

  width: 100%;

  padding: 13px;

  margin-top: 8px;

  border-radius: 10px;

  border: 1px solid #ccc;

  font-size: 16px;
}

button {

  border: 0;

  background: #111;

  color: white;

  cursor: pointer;
}

hr {

  border: 0;

  border-top: 1px solid #eee;

  margin: 25px 0;
}

.linkRow {

  display: grid;

  grid-template-columns: 1fr 1fr auto;

  gap: 8px;

  margin-top: 10px;
}

.linkRow button {

  width: auto;

  padding: 0 15px;

  background: #d33;
}

@media (max-width: 600px) {

  .linkRow {

    grid-template-columns: 1fr;
  }

  .linkRow button {

    width: 100%;

    padding: 13px;
  }

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


<!-- =====================================================
     QR
===================================================== -->

<div class="card">

<h2>🔗 QR</h2>

<form action="/admin/save" method="POST">

<input
  type="hidden"
  name="key"
  value="${escapeHtml(key)}"
>

<input
  name="qr"
  placeholder="Número del QR, ejemplo 001"
  inputmode="numeric"
  required
>

<input
  name="destino"
  type="url"
  placeholder="https://instagram.com/..."
  required
>

<button>
Guardar destino
</button>

</form>

<hr>

<h3>🔎 Consultar QR</h3>

<form action="/admin/check" method="GET">

<input
  type="hidden"
  name="key"
  value="${escapeHtml(key)}"
>

<input
  name="qr"
  placeholder="001"
  inputmode="numeric"
  required
>

<button>
Consultar
</button>

</form>

<hr>

<h3>🖨️ Generar QRs</h3>

<form action="/admin/generate" method="GET">

<input
  type="hidden"
  name="key"
  value="${escapeHtml(key)}"
>

<input
  name="from"
  type="number"
  min="1"
  value="1"
  placeholder="Desde"
  required
>

<input
  name="to"
  type="number"
  min="1"
  value="100"
  placeholder="Hasta"
  required
>

<button>
Generar QRs
</button>

</form>

</div>


<!-- =====================================================
     LINKTREE
===================================================== -->

<div class="card">

<h2>🌐 Linktree</h2>

<form
  action="/admin/linktree/save"
  method="POST"
>

<input
  type="hidden"
  name="key"
  value="${escapeHtml(key)}"
>


<label>
URL personalizada
</label>

<input
  name="slug"
  placeholder="juan"
  pattern="[a-zA-Z0-9_-]+"
  required
>

<small>
Tu Linktree será:
<br>
<strong>
${escapeHtml(url.origin)}/l/juan
</strong>
</small>


<br><br>


<label>
Nombre
</label>

<input
  name="name"
  placeholder="Juan Pérez"
  required
>


<label>
Foto de perfil
</label>

<input
  name="photo"
  type="url"
  placeholder="https://..."
>

<small>
Pegá una URL pública de una imagen.
</small>


<br><br>


<label>
Tema
</label>

<select name="theme">

<option value="light">
☀️ Claro
</option>

<option value="dark">
🌙 Oscuro
</option>

</select>


<hr>


<h3>🔗 Enlaces</h3>

<div id="links">

<div class="linkRow">

<input
  name="linkName"
  placeholder="Instagram"
  required
>

<input
  name="linkUrl"
  type="url"
  placeholder="https://instagram.com/..."
  required
>

<button
  type="button"
  onclick="removeLink(this)"
>
X
</button>

</div>

</div>


<button
  type="button"
  onclick="addLink()"
>
+ Agregar enlace
</button>


<br><br>


<button type="submit">
✨ Crear Linktree
</button>

</form>

</div>


</div>


<script>

function addLink() {

  const container =
    document.getElementById("links");

  const row =
    document.createElement("div");

  row.className = "linkRow";

  row.innerHTML = \`
    <input
      name="linkName"
      placeholder="WhatsApp"
      required
    >

    <input
      name="linkUrl"
      type="url"
      placeholder="https://..."
      required
    >

    <button
      type="button"
      onclick="removeLink(this)"
    >
      X
    </button>
  \`;

  container.appendChild(row);
}


function removeLink(button) {

  const rows =
    document.querySelectorAll(".linkRow");

  if (rows.length <= 1) {
    return;
  }

  button.parentElement.remove();
}

</script>

</body>

</html>
      `, {
        headers: {
          "Content-Type":
            "text/html; charset=UTF-8"
        }
      });
    }

    // =========================================================
    // CONSULTAR QR
    // =========================================================

    if (url.pathname === "/admin/check") {

      const key =
        url.searchParams.get("key");

      const qr =
        url.searchParams.get("qr");

      const adminKey =
        await env.QR_DB.get("ADMIN_KEY");

      if (key !== adminKey) {
        return new Response(
          "No autorizado",
          { status: 401 }
        );
      }

      const destino =
        await env.QR_DB.get(qr);

      return new Response(`
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
/>

<title>Taply QR</title>

<style>

body {
  font-family: Arial;
  padding: 20px;
  background: #f4f4f5;
}

.box {

  max-width: 600px;

  margin: auto;

  background: white;

  padding: 25px;

  border-radius: 18px;
}

.url {

  background: #eee;

  padding: 15px;

  border-radius: 10px;

  word-break: break-all;
}

</style>

</head>

<body>

<div class="box">

<h1>
QR ${escapeHtml(qr)}
</h1>

${
  destino
    ? `
<p>
Actualmente apunta a:
</p>

<div class="url">
${escapeHtml(destino)}
</div>
`
    : `
<p>
❌ Este QR todavía no está configurado.
</p>
`
}

<br>

<a
href="/admin/panel?key=${encodeURIComponent(key)}"
>
← Volver al panel
</a>

</div>

</body>

</html>
      `, {
        headers: {
          "Content-Type":
            "text/html; charset=UTF-8"
        }
      });
    }

    // =========================================================
    // GUARDAR QR
    // =========================================================

    if (
      url.pathname === "/admin/save" &&
      request.method === "POST"
    ) {

      const form =
        await request.formData();

      const key =
        form.get("key");

      const qr =
        form.get("qr");

      const destino =
        form.get("destino");

      const adminKey =
        await env.QR_DB.get("ADMIN_KEY");

      if (key !== adminKey) {
        return new Response(
          "No autorizado",
          { status: 401 }
        );
      }

      if (!qr || !destino) {
        return new Response(
          "Falta información",
          { status: 400 }
        );
      }

      await env.QR_DB.put(
        qr,
        destino
      );

      return new Response(`
<h1>✅ QR guardado</h1>

<p>
QR: ${escapeHtml(qr)}
</p>

<p>
${escapeHtml(destino)}
</p>

<a href="/admin/panel?key=${encodeURIComponent(key)}">
Volver al panel
</a>
      `, {
        headers: {
          "Content-Type":
            "text/html; charset=UTF-8"
        }
      });
    }

    // =========================================================
    // LINKTREE SAVE
    // =========================================================

    if (
      url.pathname === "/admin/linktree/save" &&
      request.method === "POST"
    ) {

      const form =
        await request.formData();

      const key =
        form.get("key");

      const adminKey =
        await env.QR_DB.get("ADMIN_KEY");

      if (key !== adminKey) {
        return new Response(
          "No autorizado",
          { status: 401 }
        );
      }

      const slug =
        String(form.get("slug") || "")
          .trim()
          .toLowerCase();

      const name =
        String(form.get("name") || "")
          .trim();

      const photo =
        String(form.get("photo") || "")
          .trim();

      const theme =
        form.get("theme") === "dark"
          ? "dark"
          : "light";

      const linkNames =
        form.getAll("linkName");

      const linkUrls =
        form.getAll("linkUrl");

      if (!slug || !name) {
        return new Response(
          "Falta el nombre o la URL personalizada",
          { status: 400 }
        );
      }

      if (!/^[a-z0-9_-]+$/.test(slug)) {
        return new Response(
          "La URL personalizada solo puede tener letras, números, guiones y guiones bajos.",
          { status: 400 }
        );
      }

      const links = [];

      for (
        let i = 0;
        i < linkNames.length;
        i++
      ) {

        const linkName =
          String(linkNames[i] || "").trim();

        const linkUrl =
          String(linkUrls[i] || "").trim();

        if (linkName && linkUrl) {

          if (
            !linkUrl.startsWith("http://") &&
            !linkUrl.startsWith("https://")
          ) {
            return new Response(
              "Todos los enlaces deben empezar con http:// o https://",
              { status: 400 }
            );
          }

          links.push({
            name: linkName,
            url: linkUrl
          });
        }
      }

      const profile = {
        slug,
        name,
        photo,
        theme,
        links
      };

      await env.QR_DB.put(
        "profile:" + slug,
        JSON.stringify(profile)
      );

      const profileUrl =
        url.origin + "/l/" + slug;

      return new Response(`
<!DOCTYPE html>

<html lang="es">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
/>

<title>Linktree creado</title>

<style>

body {

  font-family: Arial;

  background: #f4f4f5;

  padding: 20px;
}

.box {

  max-width: 600px;

  margin: auto;

  background: white;

  padding: 25px;

  border-radius: 18px;
}

.url {

  background: #eee;

  padding: 15px;

  border-radius: 10px;

  word-break: break-all;

}

button {

  padding: 13px;

  border: 0;

  border-radius: 10px;

  background: #111;

  color: white;

}

</style>

</head>

<body>

<div class="box">

<h1>
✅ Linktree creado
</h1>

<p>
Tu link es:
</p>

<div class="url">
${escapeHtml(profileUrl)}
</div>

<br>

<a
href="${escapeHtml(profileUrl)}"
target="_blank"
>
Abrir Linktree
</a>

<br><br>

<a
href="/admin/panel?key=${encodeURIComponent(key)}"
>
← Volver al panel
</a>

</div>

</body>

</html>
      `, {
        headers: {
          "Content-Type":
            "text/html; charset=UTF-8"
        }
      });
    }

    // =========================================================
    // GENERAR QR
    // =========================================================

    if (
      url.pathname === "/admin/generate"
    ) {

      const key =
        url.searchParams.get("key");

      const from =
        parseInt(
          url.searchParams.get("from")
        );

      const to =
        parseInt(
          url.searchParams.get("to")
        );

      const adminKey =
        await env.QR_DB.get("ADMIN_KEY");

      if (key !== adminKey) {
        return new Response(
          "No autorizado",
          { status: 401 }
        );
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

      for (
        let i = from;
        i <= to;
        i++
      ) {

        const id =
          String(i).padStart(3, "0");

        const qrUrl =
          url.origin + "/q/" + id;

        const qrImage =
          "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" +
          encodeURIComponent(qrUrl);

        cards += `
<div class="qr">

<img src="${qrImage}">

<div>
${id}
</div>

</div>
`;
      }

      return new Response(`
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
/>

<title>Taply QR</title>

<style>

body {

  font-family: Arial;

  margin: 0;

  background: white;
}

.toolbar {

  padding: 15px;

  background: #111;

  color: white;

  position: sticky;

  top: 0;

  z-index: 5;
}

button {

  padding: 12px 20px;

  border: 0;

  border-radius: 10px;

  background: white;
}

.grid {

  display: grid;

  grid-template-columns:
    repeat(5, 1fr);

  gap: 10px;

  padding: 10px;
}

.qr {

  text-align: center;

  padding: 8px;

  border: 1px solid #ddd;

  break-inside: avoid;
}

.qr img {

  width: 65%;

  max-width: 110px;

  display: block;

  margin: auto;
}

.qr div {

  font-size: 10px;

  margin-top: 4px;
}

@media print {

  .toolbar {
    display: none;
  }

  .grid {

    grid-template-columns:
      repeat(5, 1fr);

    gap: 5px;
  }

  .qr {
    border: 0;
  }

}

</style>

</head>

<body>

<div class="toolbar">

<button onclick="window.print()">
🖨️ Imprimir / Guardar PDF
</button>

</div>

<div class="grid">

${cards}

</div>

</body>

</html>
      `, {
        headers: {
          "Content-Type":
            "text/html; charset=UTF-8"
        }
      });
    }

    // =========================================================
    // DEFAULT
    // =========================================================

    return new Response(
      "Taply QR funcionando"
    );
  }
};


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHtml(text) {

  return String(text)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");
}
