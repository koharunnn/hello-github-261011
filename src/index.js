function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPage(posts, error) {
  const items = posts
    .map(
      (post) => `
        <li class="post">
          <div class="post-header">
            <span class="post-name">${escapeHtml(post.name)}</span>
            <span class="post-date">${escapeHtml(post.created_at)}</span>
          </div>
          <p class="post-message">${escapeHtml(post.message).replace(/\n/g, "<br>")}</p>
        </li>`
    )
    .join("");

  const errorHtml = error
    ? `<p class="error">${escapeHtml(error)}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>かんたん掲示板</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    background: #f4f5f7;
    color: #222;
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 16px 64px;
  }
  h1 {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }
  form {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
  }
  label {
    display: block;
    font-size: 0.85rem;
    color: #555;
    margin-bottom: 4px;
  }
  input, textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 8px;
    margin-bottom: 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
  textarea {
    min-height: 80px;
    resize: vertical;
  }
  button {
    background: #2d6cdf;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
  }
  button:hover {
    background: #2458b8;
  }
  .error {
    color: #c0392b;
    margin-bottom: 12px;
  }
  ul.posts {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .post {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 12px;
  }
  .post-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #777;
    margin-bottom: 6px;
  }
  .post-name {
    font-weight: bold;
    color: #2d6cdf;
  }
  .post-message {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .empty {
    color: #888;
    text-align: center;
    padding: 24px 0;
  }
</style>
</head>
<body>
  <h1>かんたん掲示板</h1>
  <p>誰でも書き込みができます。書き込みはみんなに公開されます。</p>

  ${errorHtml}

  <form method="POST" action="/">
    <label for="name">名前（省略可）</label>
    <input type="text" id="name" name="name" maxlength="40" placeholder="名無しさん">

    <label for="message">メッセージ</label>
    <textarea id="message" name="message" maxlength="1000" required placeholder="ここに書き込む"></textarea>

    <button type="submit">投稿する</button>
  </form>

  <ul class="posts">
    ${items || `<li class="empty">まだ書き込みはありません。</li>`}
  </ul>
</body>
</html>`;
}

async function handleGet(env) {
  const { results } = await env.DB.prepare(
    "SELECT name, message, created_at FROM posts ORDER BY id DESC LIMIT 200"
  ).all();

  return new Response(renderPage(results, null), {
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}

async function handlePost(request, env) {
  const form = await request.formData();
  const rawName = (form.get("name") || "").toString().trim();
  const rawMessage = (form.get("message") || "").toString().trim();

  if (!rawMessage) {
    const { results } = await env.DB.prepare(
      "SELECT name, message, created_at FROM posts ORDER BY id DESC LIMIT 200"
    ).all();
    return new Response(renderPage(results, "メッセージを入力してください。"), {
      status: 400,
      headers: { "content-type": "text/html; charset=UTF-8" },
    });
  }

  const name = (rawName || "名無しさん").slice(0, 40);
  const message = rawMessage.slice(0, 1000);

  await env.DB.prepare("INSERT INTO posts (name, message) VALUES (?, ?)")
    .bind(name, message)
    .run();

  return Response.redirect(new URL(request.url).origin + "/", 303);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/") {
      return new Response("Not Found", { status: 404 });
    }

    if (request.method === "GET") {
      return handleGet(env);
    }

    if (request.method === "POST") {
      return handlePost(request, env);
    }

    return new Response("Method Not Allowed", { status: 405 });
  },
};
