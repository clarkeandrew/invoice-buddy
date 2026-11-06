import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import Dashboard from "@/routes/dashboard";
import Customers from "@/routes/customers";
import Invoices from "@/routes/invoices";
import InvoiceCreate from "@/routes/invoice-create";
import InvoiceDetail from "@/routes/invoice-detail";
import InvoiceEdit from "@/routes/invoice-edit";
import InvoicePreviewPage from "@/routes/invoice-preview";
import Settings from "@/routes/settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceCreate />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />
          <Route path="/invoices/:id/preview" element={<InvoicePreviewPage />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
