# CloudDance revenue calculator

A no-build, static calculator you can push straight to GitHub and host with GitHub Pages.

## What this version does

- Keeps the **Traditional Placement → Full Participation** slider
- Shows **risk retained** and **risk ceded**
- Adds:
  - **Amount of premium placed in cell**
  - **Cell loss ratio**
- Calculates:
  - **Cell revenue**
  - **Cell profit**

## Formula used in this version

```text
retained risk % = slider value
ceded risk % = 100 - slider value
retained premium = premium placed × retained risk %
cell revenue = retained premium
expected losses = cell revenue × loss ratio
cell profit = cell revenue - expected losses
```

If your economics should instead use **100% of premium placed in the cell as revenue**, open `script.js` and change:

```js
revenueMode: "retained-premium"
```

to:

```js
revenueMode: "placed-premium"
```

## Files

- `index.html` – widget markup
- `styles.css` – styling
- `script.js` – calculator logic + iframe auto-height messaging

## Publish on GitHub Pages

1. Create a new GitHub repository.
2. Upload these files to the repo root.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your branch (usually `main`) and the root folder (`/`).
6. Save and wait for the Pages URL.

Your live URL will look something like:

```text
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

## Embed snippet

Use this snippet wherever you want the calculator to appear:

```html
<iframe
  id="cloud-dance-revenue-calculator"
  src="https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/"
  title="CloudDance revenue calculator"
  loading="lazy"
  style="width:100%;border:0;display:block;min-height:760px;overflow:hidden;"
></iframe>

<script>
  window.addEventListener("message", function (event) {
    if (!event.data || event.data.type !== "cloud-dance-revenue-calculator:height") {
      return;
    }

    var frame = document.getElementById("cloud-dance-revenue-calculator");
    if (!frame || event.source !== frame.contentWindow) {
      return;
    }

    frame.style.height = event.data.height + "px";
  });
</script>
```

## Quick styling changes

Edit these variables in `styles.css`:

```css
:root {
  --accent: #2563eb;
  --success: #15803d;
  --text-strong: #0f172a;
}
```

## Notes

- The widget is dependency-free.
- It is fully client-side.
- It is responsive and works on desktop/mobile.
- It sends its height to the parent page so the iframe can resize smoothly.
