import { useState, useEffect, useCallback } from "react";
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from "./types";
import * as api from "./api";

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listCustomers();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const create = async (data: CreateCustomerRequest) => {
    const customer = await api.createCustomer(data);
    setCustomers((prev) => [...prev, customer]);
    return customer;
  };

  const update = async (data: UpdateCustomerRequest) => {
    const { id, ...payload } = data;
    const customer = await api.updateCustomer(id, payload);
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? customer : c)),
    );
    return customer;
  };

  const remove = async (id: string) => {
    await api.deleteCustomer(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    create,
    update,
    remove,
  };
}
