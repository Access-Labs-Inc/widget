export const formatACSCurrency = (amount: number) => {
  const amountAsACS = amount;
  return parseFloat(
    parseFloat(amountAsACS.toString()).toFixed(2)
  ).toLocaleString("en-US", {
    useGrouping: true,
  });
};

export const formatPenyACSCurrency = (amount: number) => {
  const amountAsACS = amount / 10 ** 6;
  return parseFloat(
    parseFloat(amountAsACS.toString()).toFixed(2)
  ).toLocaleString("en-US", {
    useGrouping: true,
  });
};

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
