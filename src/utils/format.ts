export const formatPrice = (value: number) => {
  return `Rs ${value.toFixed(0)}`;
};

export const formatEta = (minutes: number) => {
  if (minutes <= 9) {
    return "8-9 min";
  }
  return `${minutes}-${minutes + 3} min`;
};
