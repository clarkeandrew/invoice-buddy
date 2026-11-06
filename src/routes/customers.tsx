import { useState } from "react";
import { useCustomers } from "@/features/customers/hooks";
import type { Customer } from "@/features/customers/types";
import type { CreateCustomerFormData } from "@/features/customers/validators";
import CustomerList from "@/components/customers/CustomerList";
import CustomerForm from "@/components/customers/CustomerForm";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";

export default function Customers() {
  const { customers, loading, error, create, update, remove } = useCustomers();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  function openCreateModal() {
    setEditingCustomer(null);
    setModalOpen(true);
  }

  function openEditModal(customer: Customer) {
    setEditingCustomer(customer);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCustomer(null);
  }

  async function handleSubmit(data: CreateCustomerFormData) {
    if (editingCustomer) {
      await update({ id: editingCustomer.id, ...data });
    } else {
      await create(data);
    }
    closeModal();
  }

  async function handleDelete() {
    if (deletingCustomer) {
      await remove(deletingCustomer.id);
      setDeletingCustomer(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Button onClick={openCreateModal}>+ New Customer</Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading customers...</p>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
      ) : (
        <CustomerList
          customers={customers}
          onEdit={openEditModal}
          onDelete={setDeletingCustomer}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingCustomer ? "Edit Customer" : "New Customer"}
      >
        <CustomerForm
          initialValues={editingCustomer ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitLabel={editingCustomer ? "Update" : "Create"}
        />
      </Modal>

      <ConfirmDialog
        open={!!deletingCustomer}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deletingCustomer?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeletingCustomer(null)}
      />
    </div>
  );
}
