
export const formatACSCurrency = (amount: number) => {
  return parseFloat(
    parseFloat(amount.toString()).toFixed(2)
  ).toLocaleString('en-US', {
    useGrouping: true,
  });
}
