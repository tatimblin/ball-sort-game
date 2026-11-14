// The game as an embed for tristantimblin.dev: `mount(el, { assetBase })`
// renders it into `el`, filling it (and scrolling inside it when `el` is
// short), and returns `{ destroy }`. vite.embed.config.ts builds this into
// one ES module, dist/index.js, with the stylesheet inside it. `assetBase` is
// part of the contract but unused: the bundle loads nothing of its own.
import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from './App';
import css from './index.css?inline';

export interface MountOptions {
  assetBase?: string;
  /** The root's touch-action. `manipulation` (the default) lets a finger
   *  scroll the game when `el` is too short for it and stops double-tap zoom. */
  touchAction?: string;
}

export interface Handle {
  destroy(): void;
}

export function mount(el: HTMLElement, opts: MountOptions = {}): Handle {
  // The stylesheet is scoped under .bsg-root and lives beside the root, so
  // it goes when the game does.
  const style = document.createElement('style');
  style.textContent = css;

  const host = document.createElement('div');
  host.className = 'bsg-root';
  host.style.cssText = 'height: 100%; overflow: auto; overscroll-behavior: contain;';
  host.style.touchAction = opts.touchAction ?? 'manipulation';
  el.append(style, host);

  // React listens on `host`, except for one `selectionchange` listener it
  // adds to the document on the first createRoot and never removes. Note
  // what it adds there so destroy() can take it off again (the game uses no
  // onSelect, so a later mount, which React skips adding it for, loses nothing).
  const added: Parameters<Document['addEventListener']>[] = [];
  const addEventListener = document.addEventListener;
  document.addEventListener = function (this: Document, ...args: Parameters<Document['addEventListener']>) {
    added.push(args);
    return addEventListener.apply(this, args);
  };
  let root: Root;
  try {
    root = createRoot(host);
  } finally {
    document.addEventListener = addEventListener;
  }
  root.render(createElement(App));

  let live = true;
  return {
    destroy() {
      if (!live) return;
      live = false;
      for (const args of added) document.removeEventListener(...args);
      root.unmount();
      host.remove();
      style.remove();
    },
  };
}
