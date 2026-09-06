export function initializeRestaurantImage(root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>('[data-toggle]');
  const photo = root.querySelector<HTMLImageElement>('[data-photo]');
  const illustration = root.querySelector<HTMLImageElement>('[data-illustration]');
  const frame = root.querySelector<HTMLElement>('.restaurant-image-frame');
  const caption = root.querySelector<HTMLElement>('[data-caption]');
  if (!button || !photo || !illustration || !frame || !caption) return;
  const subject = button.getAttribute('aria-label')!.replace(/^Show photo/, '');
  button.replaceChildren(caption);
  let pinned = false;
  let hovering = false;
  const update = () => {
    const visible = pinned || hovering;
    root.dataset.photoVisible = String(visible);
    photo.setAttribute('aria-hidden', String(!visible));
    illustration.setAttribute('aria-hidden', String(visible));
    caption.textContent = visible ? 'Original photo' : 'Generated illustration';
    const label = pinned ? 'Show illustration' : 'Show photo';
    button.setAttribute('aria-label', `${caption.textContent}. ${label}${subject}`);
    button.setAttribute('aria-pressed', String(pinned));
  };
  frame.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    update();
  });
  for (const event of ['pointerleave', 'pointercancel']) frame.addEventListener(event, () => {
    hovering = false;
    update();
  });
  button.addEventListener('click', () => {
    pinned = !pinned;
    hovering = false;
    update();
  });
  update();
  button.hidden = false;
}
