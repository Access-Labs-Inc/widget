export const formatACSCurrency = (amount: number) => {
  const amountAsACS = amount / 10 ** 6;
  return parseFloat(
    parseFloat(amountAsACS.toString()).toFixed(2)
  ).toLocaleString("en-US", {
    useGrouping: true,
  });
};
