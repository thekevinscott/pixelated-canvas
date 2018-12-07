const makeElement = (type: string = 'div', opts = {}) => {
  const el = document.createElement(type);
  Object.keys(opts).forEach(key => {
    el[key] = opts[key];
  });
  return el;
};

export default makeElement;
