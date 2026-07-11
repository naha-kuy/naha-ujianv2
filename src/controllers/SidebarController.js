export function isActive(path, currentPath) {
  if (path === "#") return false;
  return currentPath === path;
}
