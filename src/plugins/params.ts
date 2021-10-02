export const params = (() => {
  const query = location.search.slice(1);
  const params: Record<string, string> = {};
  let match;
  const paramsRegex = /vk_([\w-]+)=([\w-]+)/g;

  while ((match = paramsRegex.exec(query)) !== null) {
    params[match[1]] = match[2];
  }

  return params;
})();
