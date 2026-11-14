# ball sort game

A puzzle: tap a column to pick up its top cube, tap another to drop it there
(or drag it, with a mouse). A cube lands only on an empty column or on its own
color, four to a column. Stack every color in its own column to win the level.

Play it at https://tatimblin.github.io/ball-sort-game/.

## develop

```sh
npm install
npm run dev     # the page, with hot reload
npm run check   # type check
npm test        # unit tests (vitest)
npm run build   # the page → build/
```

## embed

The game also ships as one ES module, `dist/index.js`, which
[tristantimblin.dev](https://tristantimblin.dev/) loads from GitHub Pages:

```js
import { mount } from "https://tatimblin.github.io/ball-sort-game/dist/index.js";
const { destroy } = mount(el, { assetBase }); // fills `el`; destroy() removes it
```

Its styles (Tailwind's preflight included) are scoped under `.bsg-root` and
injected beside the game, so they neither leak onto the host page nor are
broken by its element rules. `touchAction` (default `manipulation`) sets the
root's `touch-action`.

`npm run build:embed` builds it locally. To release, bump `version`, merge,
and tag `v<version>` on master: the Pages workflow builds the page and the
embed and deploys both.
