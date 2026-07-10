export function isActive(path, currentPath) {
  if (path === "#") return false;
  if (path === currentPath) return true;
  if (path !== "/" && currentPath.startsWith(path)) return true;
  return false;
}
