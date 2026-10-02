const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const shortDateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const formatDate = (value) => dateFormat.format(new Date(value));
export const formatShortDate = (value) => shortDateFormat.format(new Date(value));
export const formatTime = (value) => timeFormat.format(new Date(value));
export const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value);

export function timeAgo(value) {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  const steps = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.35, 'week'],
    [12, 'month'],
  ];
  let amount = seconds;
  for (const [size, unit] of steps) {
    if (amount < size) return `${Math.floor(amount)} ${unit}${Math.floor(amount) === 1 ? '' : 's'} ago`;
    amount /= size;
  }
  return `${Math.floor(amount)} years ago`;
}

export const toRoman = (num) => {
  const map = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let n = num;
  let out = '';
  for (const [value, glyph] of map) {
    while (n >= value) {
      out += glyph;
      n -= value;
    }
  }
  return out;
};
