export function initializeRestaurantImage(root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>('[data-toggle]');
  const template = root.querySelector<HTMLTemplateElement>('[data-photo-template]');
  const illustration = root.querySelector<HTMLImageElement>('[data-illustration]');
  const frame = root.querySelector<HTMLElement>('.restaurant-image-frame');
  const caption = root.querySelector<HTMLElement>('[data-caption]');
  const status = root.querySelector<HTMLElement>('[data-status]');
  if (!button || !template || !illustration || !frame || !caption || !status) return;
  const subject = button.getAttribute('aria-label')!.replace(/^Show photo/, '');
  button.replaceChildren(caption);
  let pinned = false;
  let hovering = false;
  let state: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
  let photo: HTMLImageElement | undefined;
  const update = () => {
    const visible = state === 'ready' && (pinned || hovering);
    root.dataset.photoVisible = String(visible);
    root.dataset.photoState = state;
    photo?.setAttribute('aria-hidden', String(!visible));
    illustration.setAttribute('aria-hidden', String(visible));
    caption.textContent = state === 'error' ? 'Photo unavailable — retry' : visible ? 'Original photo' : 'Generated illustration';
    const label = state === 'error' ? 'Retry photo' : pinned ? 'Show illustration' : 'Show photo';
    button.setAttribute('aria-label', `${caption.textContent}. ${label}${subject}`);
    button.setAttribute('aria-pressed', String(pinned));
    status.textContent = state === 'loading' ? 'Loading photo.' : state === 'error' ? 'Photo could not be loaded. Activate the caption to retry.' : '';
  };
  const load = () => {
    if (state === 'loading' || state === 'ready') return;
    photo?.closest('picture')?.remove();
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const next = fragment.querySelector<HTMLImageElement>('[data-photo]')!;
    photo = next;
    state = 'loading';
    const failed = () => { state = 'error'; update(); };
    next.addEventListener('error', failed, { once: true });
    next.addEventListener('load', async () => {
      try {
        await next.decode();
        state = 'ready';
        // Consult current intent: leaving/unpinning during decode must not reveal.
        update();
      } catch { failed(); }
    }, { once: true });
    frame.append(fragment);
    update();
  };
  frame.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    load();
    update();
  });
  for (const event of ['pointerleave', 'pointercancel']) frame.addEventListener(event, () => {
    hovering = false;
    update();
  });
  button.addEventListener('focus', load);
  button.addEventListener('click', () => {
    pinned = state === 'error' || !pinned;
    hovering = false;
    load();
    update();
  });
  update();
  button.hidden = false;
}
