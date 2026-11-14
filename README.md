# ball sort game

A puzzle: tap a column to pick up its top cube, tap another to drop it there
(or drag it, with a mouse). A cube lands only on an empty column or on its own
color, four to a column. Stack every color in its own column to win the level.

Levels are dealt from a seed (`src/utils/generator.ts`) at four difficulties,
each checked solvable by an A* solver (`src/utils/solver.ts`):

| difficulty | fills | spare columns | columns | fewest moves |
| ---------- | ----- | ------------- | ------- | ------------ |
| easy       | 3     | 2             | 5       | 8–12         |
| medium     | 4     | 2             | 6       | 12–17        |
| hard       | 6     | 2             | 8       | 20–25        |
| expert     | 8     | 2             | 10      | 28–35        |

Harder tiers also mix deeper (medium and hard deal no column with three of a
fill in a row, expert none with two) and must need at least the fewest moves
shown. Winning deals the next seed at the same difficulty.

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
root's `touch-action`, and `difficulty` (`easy`, `medium`, the default, `hard`
or `expert`) the tier it starts at.

`npm run build:embed` builds it locally. To release, bump `version`, merge,
and tag `v<version>` on master: the Pages workflow builds the page and the
embed and deploys both.
