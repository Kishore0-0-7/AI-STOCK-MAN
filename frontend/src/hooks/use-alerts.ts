import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

const API_BASE_URL = 'http://localhost:4000/api';

export interface Alert {
  id: string;
  name: string;
  current_stock: number;
  low_stock_threshold: number;
  category: string;
  qr_code: string;
  alert_priority: 'high' | 'medium' | 'low';
  stock_status: 'Out of Stock' | 'Critical' | 'Low' | 'Warning';
  updated_at: string;
  supplier_name: string;
  supplier_email: string;
  supplier_phone: string;
  price: number;
  unit: string;
}

export interface IgnoredAlert {
  id: string;
  name: string;
  current_stock: number;
  low_stock_threshold: number;
  category: string;
  qr_code: string;
  alert_priority: 'high' | 'medium' | 'low';
  updated_at: string;
  supplier_name: string;
}

export interface ResolvedAlert {
  id: string;
  name: string;
  current_stock: number;
  low_stock_threshold: number;
  category: string;
  qr_code: string;
  updated_at: string;
  po_number: string;
  quantity_ordered: number;
  supplier_name: string;
}

export interface PurchaseOrderData {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface SendPOData {
  poId: string;
  method: 'email' | 'whatsapp';
  recipientInfo: string;
}

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [ignoredAlerts, setIgnoredAlerts] = useState<IgnoredAlert[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<ResolvedAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch low stock alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/alerts/low-stock`);
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({
        title: "Error",
        description: "Failed to fetch alerts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch ignored alerts
  const fetchIgnoredAlerts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/ignored`);
      if (!response.ok) throw new Error('Failed to fetch ignored alerts');
      const data = await response.json();
      setIgnoredAlerts(data);
    } catch (err) {
      console.error('Error fetching ignored alerts:', err);
    }
  }, []);

  // Fetch resolved alerts
  const fetchResolvedAlerts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/resolved`);
      if (!response.ok) throw new Error('Failed to fetch resolved alerts');
      const data = await response.json();
      setResolvedAlerts(data);
    } catch (err) {
      console.error('Error fetching resolved alerts:', err);
    }
  }, []);

  // Ignore an alert
  const ignoreAlert = async (productId: string, reason?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/ignore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, reason }),
      });

      if (!response.ok) throw new Error('Failed to ignore alert');

      // Refresh alerts
      await fetchAlerts();
      await fetchIgnoredAlerts();

      toast({
        title: "Alert Ignored",
        description: "The alert has been moved to ignored alerts.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to ignore alert",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Create purchase order
  const createPurchaseOrder = async (data: PurchaseOrderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create purchase order');

      const result = await response.json();

      // Refresh alerts
      await fetchAlerts();
      await fetchResolvedAlerts();

      toast({
        title: "Purchase Order Created",
        description: `PO ${result.poNumber} has been generated.`,
      });

      return result;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Send purchase order to supplier
  const sendPurchaseOrder = async (data: SendPOData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/alerts/send-po`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to send purchase order');

      const result = await response.json();

      toast({
        title: "Purchase Order Sent",
        description: result.message,
      });

      return result;
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send purchase order",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Load all data on mount
  useEffect(() => {
    fetchAlerts();
    fetchIgnoredAlerts();
    fetchResolvedAlerts();
  }, [fetchAlerts, fetchIgnoredAlerts, fetchResolvedAlerts]);

  return {
    alerts,
    ignoredAlerts,
    resolvedAlerts,
    loading,
    error,
    fetchAlerts,
    fetchIgnoredAlerts,
    fetchResolvedAlerts,
    ignoreAlert,
    createPurchaseOrder,
    sendPurchaseOrder,
  };
};
