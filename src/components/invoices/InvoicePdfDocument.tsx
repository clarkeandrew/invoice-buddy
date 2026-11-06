import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { Invoice } from "@/features/invoices/types";
import type { CompanyProfile } from "@/features/settings/types";
import type { InvoiceAppearance } from "@/lib/invoice-appearance";
const BLUE = "#2563eb";
const GRAY_50 = "#f9fafb";
const GRAY_200 = "#e5e7eb";
const GRAY_400 = "#9ca3af";
const GRAY_600 = "#4b5563";
const GRAY_900 = "#111827";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: GRAY_900,
    backgroundColor: "#ffffff",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_200,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  logo: {
    maxHeight: 50,
    maxWidth: 150,
  },
  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: GRAY_900,
  },
  invoiceTitleText: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#d1d5db",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  invoiceNumber: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
    textAlign: "right",
    marginTop: 4,
  },
  // Info columns
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoCol: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GRAY_400,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 9,
    color: GRAY_600,
    marginBottom: 1,
  },
  customerName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: GRAY_900,
    marginBottom: 2,
  },
  // Metadata strip
  metaStrip: {
    flexDirection: "row",
    backgroundColor: GRAY_50,
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
    gap: 20,
  },
  metaItem: {},
  metaLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GRAY_400,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: GRAY_900,
  },
  metaDivider: {
    width: 1,
    backgroundColor: GRAY_200,
  },
  // Table
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: GRAY_50,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: "#fafbfc",
  },
  colDescription: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colPrice: { width: 70, textAlign: "right" },
  colAmount: { width: 70, textAlign: "right" },
  thText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GRAY_400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 10,
    color: GRAY_600,
  },
  cellTextDark: {
    fontSize: 10,
    color: GRAY_900,
  },
  cellTextBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: GRAY_900,
  },
  // Totals
  totalsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  totalsBox: {
    width: 220,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  totalsLabel: {
    fontSize: 10,
    color: GRAY_600,
  },
  totalsValue: {
    fontSize: 10,
    color: GRAY_900,
  },
  totalDivider: {
    borderTopWidth: 1,
    borderTopColor: GRAY_200,
    marginTop: 4,
    paddingTop: 6,
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  totalLabelFinal: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: GRAY_900,
  },
  totalValueFinal: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
  },
  // Notes
  notesBox: {
    backgroundColor: GRAY_50,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 9,
    color: GRAY_600,
    lineHeight: 1.5,
  },
  // Payment
  paymentSection: {
    borderTopWidth: 1,
    borderTopColor: GRAY_200,
    paddingTop: 16,
    marginBottom: 16,
  },
  // Footer
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: GRAY_400,
  },
});

function fmtMoney(cents: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface Props {
  invoice: Invoice;
  companyProfile?: CompanyProfile | null;
  logoDataUrl?: string | null;
  appearance: InvoiceAppearance;
}

export default function InvoicePdfDocument({ invoice, companyProfile, logoDataUrl, appearance }: Props) {
  const subtotal = invoice.subtotal_amount ?? 0;
  const taxAmount = invoice.tax_amount ?? 0;
  const total = invoice.total_amount ?? 0;

  const hasCustomerAddress =
    invoice.customer_address_line_1 ||
    invoice.customer_city ||
    invoice.customer_postcode ||
    invoice.customer_country;

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily: appearance.pdfFontFamily }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoDataUrl && (
              <Image src={logoDataUrl} style={styles.logo} />
            )}
            <View>
              <Text style={[styles.companyName, { fontFamily: appearance.pdfFontFamilyBold }]}>
                {companyProfile?.company_name || "Your Company"}
              </Text>
            </View>
          </View>
          <View>
            <Text style={[styles.invoiceTitleText, { fontFamily: appearance.pdfFontFamilyBold }]}>Invoice</Text>
            <Text style={[styles.invoiceNumber, { color: appearance.accentColor, fontFamily: appearance.pdfFontFamilyBold }]}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Two-column info: From / Bill To */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text style={styles.sectionLabel}>From</Text>
            {companyProfile?.address_line_1 ? (
              <Text style={styles.infoText}>{companyProfile.address_line_1}</Text>
            ) : null}
            {companyProfile?.address_line_2 ? (
              <Text style={styles.infoText}>{companyProfile.address_line_2}</Text>
            ) : null}
            {(companyProfile?.city || companyProfile?.postcode) ? (
              <Text style={styles.infoText}>
                {companyProfile.city}{companyProfile.city && companyProfile.postcode ? ", " : ""}{companyProfile.postcode}
              </Text>
            ) : null}
            {companyProfile?.country ? (
              <Text style={styles.infoText}>{companyProfile.country}</Text>
            ) : null}
            {companyProfile?.email ? (
              <Text style={{ ...styles.infoText, marginTop: 3 }}>{companyProfile.email}</Text>
            ) : null}
            {companyProfile?.phone ? (
              <Text style={styles.infoText}>{companyProfile.phone}</Text>
            ) : null}
            {companyProfile?.tax_number ? (
              <Text style={{ fontSize: 8, color: GRAY_400, marginTop: 3 }}>VAT No. {companyProfile.tax_number}</Text>
            ) : null}
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={[styles.customerName, { fontFamily: appearance.pdfFontFamilyBold }]}>{invoice.customer_name}</Text>
            {hasCustomerAddress && (
              <>
                {invoice.customer_address_line_1 ? (
                  <Text style={styles.infoText}>{invoice.customer_address_line_1}</Text>
                ) : null}
                {invoice.customer_address_line_2 ? (
                  <Text style={styles.infoText}>{invoice.customer_address_line_2}</Text>
                ) : null}
                {(invoice.customer_city || invoice.customer_postcode) ? (
                  <Text style={styles.infoText}>
                    {invoice.customer_city}{invoice.customer_city && invoice.customer_postcode ? ", " : ""}{invoice.customer_postcode}
                  </Text>
                ) : null}
                {invoice.customer_country ? (
                  <Text style={styles.infoText}>{invoice.customer_country}</Text>
                ) : null}
              </>
            )}
            {invoice.customer_email ? (
              <Text style={{ ...styles.infoText, marginTop: 3 }}>{invoice.customer_email}</Text>
            ) : null}
          </View>
        </View>

        {/* Metadata strip */}
        <View style={styles.metaStrip}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Invoice #</Text>
            <Text style={styles.metaValue}>{invoice.invoice_number}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>{fmtDate(invoice.issue_date)}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Due Date</Text>
            <Text style={styles.metaValue}>{fmtDate(invoice.due_date)}</Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDescription}>
              <Text style={styles.thText}>Description</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.thText}>Qty</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.thText}>Unit Price</Text>
            </View>
            <View style={styles.colAmount}>
              <Text style={styles.thText}>Amount</Text>
            </View>
          </View>

          {invoice.line_items.map((item, idx) => {
            const lineTotal = (item.quantity * item.unit_price) / 100;
            return (
              <View
                style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
                key={item.id || idx}
              >
                <View style={styles.colDescription}>
                  <Text style={styles.cellTextDark}>{item.description}</Text>
                </View>
                <View style={styles.colQty}>
                  <Text style={styles.cellText}>{(item.quantity / 100).toFixed(2)}</Text>
                </View>
                <View style={styles.colPrice}>
                  <Text style={styles.cellText}>{fmtMoney(item.unit_price)}</Text>
                </View>
                <View style={styles.colAmount}>
                  <Text style={styles.cellTextBold}>{fmtMoney(lineTotal)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{fmtMoney(subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                VAT ({(invoice.tax_rate / 100).toFixed(2)}%)
              </Text>
              <Text style={styles.totalsValue}>{fmtMoney(taxAmount)}</Text>
            </View>
            <View style={styles.totalDivider}>
              <View style={styles.totalRowFinal}>
                <Text style={[styles.totalLabelFinal, { fontFamily: appearance.pdfFontFamilyBold }]}>Total</Text>
                <Text style={[styles.totalValueFinal, { color: appearance.accentColor, fontFamily: appearance.pdfFontFamilyBold }]}>{fmtMoney(total)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notes */}
        {appearance.showNotes && invoice.notes?.trim() ? (
          <View style={styles.notesBox}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* Payment Details */}
        {appearance.showPaymentDetails && companyProfile?.payment_details ? (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionLabel}>Payment Information</Text>
            <Text style={styles.notesText}>{companyProfile.payment_details}</Text>
          </View>
        ) : null}

        {/* Footer */}
        {appearance.showFooter ? (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{appearance.footerText}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
