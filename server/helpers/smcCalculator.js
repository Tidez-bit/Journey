function calculatePDArray(high, low, currentPrice) {
  if (high === low) return { pdArray: 'EQUILIBRIUM', percent: 50 };
  const range = high - low;
  const position = currentPrice - low;
  const percent = (position / range) * 100;
  
  let pdArray = 'EQUILIBRIUM';
  if (percent > 50) pdArray = 'PREMIUM';
  if (percent < 50) pdArray = 'DISCOUNT';
  
  return { pdArray, percent };
}

module.exports = { calculatePDArray };
