const makeElement = (type: string = 'div', klass?: string, opts = {}) => {
  const el = document.createElement(type);
  if (klass) {
    el.classList.add(klass);
  }
  Object.keys(opts).forEach(key => {
    el[key] = opts[key];
  });
  return el;
};

export default makeElement;
