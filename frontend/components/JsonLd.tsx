/** Structured data for search engines (schema.org JSON-LD): the business, the
 *  trailer as a product, the FAQ. Rendered as a script tag Google reads;
 *  visitors never see it. */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // "<" is escaped so the JSON can never close the script tag early.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
