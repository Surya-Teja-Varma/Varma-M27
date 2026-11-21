export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Signal Interrupted — VARMA 27</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <style>
      body { font: 15px/1.5 "Inter", system-ui, -apple-system, sans-serif; background: #F5F7FA; color: #172238; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2.25rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 1rem; box-shadow: 0 12px 32px -16px rgba(23, 34, 56, 0.16); }
      .eyebrow { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #F4511E; margin: 0 0 0.5rem; }
      h1 { font-size: 1.35rem; font-weight: 700; margin: 0 0 0.5rem; color: #172238; }
      p { color: #667487; margin: 0 0 1.5rem; font-size: 0.925rem; }
      .actions { display: flex; gap: 0.625rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.625rem 1.15rem; border-radius: 0.5rem; font: inherit; font-weight: 600; font-size: 0.875rem; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: transform 150ms ease, filter 150ms ease; }
      a:hover, button:hover { transform: translateY(-1px); }
      .primary { background: linear-gradient(135deg, #FF702E 0%, #F4511E 100%); color: #FFFFFF; }
      .secondary { background: #FFFFFF; color: #172238; border-color: #CBD5E1; }
    </style>
  </head>
  <body>
    <div class="card">
      <p class="eyebrow">VARMA 27 · Mission 2027</p>
      <h1>This page didn't load</h1>
      <p>Something unexpected happened. Refresh the view or return to Mission Control.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Mission Control</a>
      </div>
    </div>
  </body>
</html>`;
}
