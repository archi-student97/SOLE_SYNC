export function getData(key) {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function setData(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeData(key) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

export function clearAll() {
  if (typeof window === "undefined") return;
  localStorage.clear();
}
