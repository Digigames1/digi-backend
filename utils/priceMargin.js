function addMarginToPriceValue(value, margin) {
  if (typeof value === 'number') {
    return Number((value * (1 + margin)).toFixed(2));
  }
  if (Array.isArray(value)) {
    return value.map(v => addMarginToPriceValue(v, margin));
  }
  if (value && typeof value === 'object') {
    const result = {};
    for (const key in value) {
      result[key] = addMarginToPriceValue(value[key], margin);
    }
    return result;
  }
  return value;
}

function addMarginToPrices(data, margin = 0.1) {
  if (Array.isArray(data)) {
    return data.map(item => addMarginToPrices(item, margin));
  }
  if (data && typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (key.toLowerCase().includes('price')) {
        result[key] = addMarginToPriceValue(data[key], margin);
      } else {
        result[key] = addMarginToPrices(data[key], margin);
      }
    }
    return result;
  }
  return data;
}

module.exports = { addMarginToPrices };
