export default function robots() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    rules: isProduction
      ? [{ userAgent: "*", disallow: ["/"] }]
      : [{ userAgent: "*", allow: ["/"] }],
  };
}
