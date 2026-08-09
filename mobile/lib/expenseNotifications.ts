export type ParsedExpenseNotification = {
  merchant: string;
  amount: number | null;
  confidence: number;
};

const amountPattern = /(?:R|ZAR)\s?([0-9]+(?:[ ,.][0-9]{3})*(?:[.,][0-9]{2})?)/i;

export function parseExpenseNotification(text: string): ParsedExpenseNotification {
  const amountMatch = text.match(amountPattern);
  const amount = amountMatch ? Number(amountMatch[1].replace(/\s/g, '').replace(/,/g, '')) : null;
  const merchant = inferMerchant(text);
  const confidence = Math.min(0.95, 0.35 + (amount ? 0.35 : 0) + (merchant !== 'Unknown merchant' ? 0.25 : 0));

  return { merchant, amount, confidence };
}

function inferMerchant(text: string): string {
  const candidates = [
    /(?:at|from|to)\s+([A-Z0-9][A-Z0-9 &.'-]{2,30})/i,
    /purchase\s+([A-Z0-9][A-Z0-9 &.'-]{2,30})/i,
  ];

  for (const pattern of candidates) {
    const match = text.match(pattern);
    if (match?.[1]) return cleanMerchant(match[1]);
  }

  return 'Unknown merchant';
}

function cleanMerchant(value: string): string {
  return value
    .replace(/\s+(was|has|for|on|using).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}
