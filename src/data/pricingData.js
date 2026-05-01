export const domainPricing = [
  { extension: ".com", price: 12.99, popular: true },
  { extension: ".net", price: 14.99, popular: false },
  { extension: ".org", price: 13.99, popular: false },
  { extension: ".io", price: 39.99, popular: false },
  { extension: ".africa", price: 19.99, popular: false },
  { extension: ".com.gh", price: 24.99, popular: false },
  { extension: ".gh", price: 29.99, popular: false },
];

export const hostingPlans = [
  { name: "Basic", price: 9, period: "month", features: ["10 GB Storage", "1 Domain", "Free SSL"], featured: false },
  { name: "Standard", price: 29, period: "month", features: ["50 GB Storage", "5 Domains", "Priority Support"], featured: true },
  { name: "Pro", price: 99, period: "month", features: ["Unlimited", "24/7 Support"], featured: false },
];

export function getDomainPrice(tld) {
  const d = domainPricing.find((x) => x.extension === tld);
  return d ? d.price : 12.99;
}
