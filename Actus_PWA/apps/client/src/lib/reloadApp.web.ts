// Reload do app (web): recarrega a página.
export function reloadApp(): void {
  if (typeof location !== 'undefined') location.reload();
}
