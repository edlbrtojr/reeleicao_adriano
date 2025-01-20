export const formatNumber = (num: number, type: 'K' | 'M'): string => {
  if (type === 'K') {
    return `${(num / 1000).toFixed(1)} Mil`;
  } else if (type === 'M') {
    return `${(num / 1000000).toFixed(1)} Mi`;
  }
  return num.toString();
};
