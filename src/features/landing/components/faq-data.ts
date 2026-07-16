export const buildFaqs = (appName: string) => [
  {
    question: "How fast are payments delivered?",
    answer:
      "Most airtime, data and electricity purchases complete within seconds. If a provider is slow to respond, we retry automatically in the background.",
  },
  {
    question: "Are there any hidden fees?",
    answer: `No. Airtime purchases come with a discount, and every other transaction carries zero ${appName} fees. Any charge is always shown before you confirm.`,
  },
  {
    question: "Is my money safe?",
    answer:
      "Your wallet is backed by a dedicated virtual account in your name. We never store your card or bank credentials on our servers.",
  },
  {
    question: "What happens if a transaction fails?",
    answer:
      "If a purchase fails after your wallet is debited, the amount is automatically reversed — no support ticket required.",
  },
  {
    question: "Which networks and billers are supported?",
    answer:
      "All four major mobile networks, DStv, GOtv and Startimes for cable TV, and every major electricity distribution company nationwide.",
  },
  {
    question: `Can I use ${appName} for my business?`,
    answer:
      "Yes — many customers use their wallet and virtual account to resell data and airtime to their own customers at a markup.",
  },
];
