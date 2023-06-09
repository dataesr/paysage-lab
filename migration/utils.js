export function capitalize(string) {
  if (!string) return;
  const res = string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  return res.trim();
}
export function capitalizeArray(array) {
  return array.map((a) => capitalize(a));
}