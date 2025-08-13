# Stock Summary API Integration Guide

## Overview
This guide shows how to integrate the new Stock Summary API with your existing React frontend component.

## Backend API Endpoints

The backend now provides these endpoints for the Stock Summary page:

- `GET /api/v1/stock-summary` - Get paginated stock summary with filters
- `GET /api/v1/stock-summary/movements/:productId` - Get stock movements for a product
- `GET /api/v1/stock-summary/trends` - Get stock movement trends
- `GET /api/v1/stock-summary/category-distribution` - Get category distribution

## Frontend Integration

### 1. Update StockSummary.tsx to use real API

Replace the static `stockData` array with API calls. Here's how to modify the component:

```typescript
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api"; // Updated API service

// Remove the static stockData array and replace with state
export default function StockSummary() {
  const { toast } = useToast();
  
  // State for API data
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stockStats, setStockStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
    avgTurnover: 0
  });
  const [categories, setCategories] = useState([]);
  
  // Existing state variables...
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;

  // Fetch stock summary data
  const fetchStockSummary = async () => {
    try {
      setLoading(true);
      const response = await api.stockSummary.getStockSummary({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        category: categoryFilter,
        stockFilter: stockFilter,
        sortBy: sortBy,
        sortOrder: sortOrder
      });

      if (response.success) {
        setStockData(response.data.items);
        setStockStats(response.data.stats);
        setCategories(response.data.categories);
      } else {
        setError(response.message || "Failed to fetch stock summary");
      }
    } catch (err) {
      setError("Failed to fetch stock summary");
      toast({
        title: "Error",
        description: "Failed to fetch stock summary",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchStockSummary();
  }, [currentPage, searchTerm, categoryFilter, stockFilter, sortBy, sortOrder]);

  // Update the categories useMemo to use API data
  const categoriesForFilter = useMemo(() => {
    return ["all", ...categories];
  }, [categories]);

  // Remove the filteredAndSortedStock useMemo since filtering is now done on backend
  // Remove the stockStats calculation since it comes from API

  // Update pagination to use API response
  const totalPages = Math.ceil(stockStats.total / itemsPerPage);

  // Rest of your component remains the same...
}
```

### 2. Update Product Movements Dialog

When showing product movements in the details dialog, fetch real movement data:

```typescript
const fetchProductMovements = async (productId: string) => {
  try {
    const response = await api.stockSummary.getProductMovements(productId, { limit: 10 });
    if (response.success) {
      // Update selectedItem with real movements
      setSelectedItem(prev => ({
        ...prev,
        movements: response.data.movements
      }));
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to fetch product movements",
      variant: "destructive",
    });
  }
};

// Call this when opening the details dialog
const handleViewDetails = async (item) => {
  setSelectedItem(item);
  setIsDetailsDialogOpen(true);
  await fetchProductMovements(item.id);
};
```

### 3. Add Loading and Error States

Add loading spinners and error handling to improve user experience:

```typescript
// Add loading spinner
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
    </div>
  );
}

// Add error state
if (error) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchStockSummary}>Retry</Button>
      </div>
    </div>
  );
}
```

### 4. Update Export Function

Update the CSV export to use real data:

```typescript
const exportToCSV = async () => {
  try {
    // Fetch all data for export (without pagination)
    const response = await api.stockSummary.getStockSummary({
      limit: 10000, // Large number to get all items
      search: searchTerm,
      category: categoryFilter,
      stockFilter: stockFilter,
      sortBy: sortBy,
      sortOrder: sortOrder
    });

    if (response.success) {
      const csvData = response.data.items.map((item) => ({
        SKU: item.sku,
        Name: item.name,
        Category: item.category,
        "Current Stock": item.currentStock,
        "Reorder Level": item.reorderLevel,
        "Max Stock": item.maxStock,
        Unit: item.unit,
        "Cost Price (₹)": item.costPrice,
        "Selling Price (₹)": item.sellingPrice,
        Supplier: item.supplier,
        "Stock Value (₹)": item.stockValue,
        "Turnover Ratio": item.stockTurnover,
        Location: item.location,
        "Last Restocked": item.lastRestocked,
      }));

      // Generate and download CSV
      const csv = [
        Object.keys(csvData[0]).join(","),
        ...csvData.map((row) =>
          Object.values(row)
            .map((v) => `"${v}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stock-summary-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    }
  } catch (error) {
    toast({
      title: "Error",
      description: "Failed to export stock summary",
      variant: "destructive",
    });
  }
};
```

## Starting the Backend Server

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will run on `http://localhost:5000` and the Stock Summary API will be available at:
- `http://localhost:5000/api/v1/stock-summary`

## Testing the API

Run the test script to verify all endpoints are working:

```bash
cd backend
chmod +x test-stock-summary-api.sh
./test-stock-summary-api.sh
```

## Database Requirements

Make sure your database has the required tables:
- `products` - Main product information
- `suppliers` - Supplier details
- `stock_movements` - Stock movement history

The API will work with the existing database schema defined in `database/ai_stock_management_schema.sql`.

## Performance Considerations

- The API includes pagination to handle large datasets efficiently
- Stock calculations are optimized with proper database indexing
- Consider adding caching for frequently accessed data in production
- Movement history is limited to recent records for better performance

## Error Handling

The API includes comprehensive error handling:
- Input validation for all parameters
- Database connection error handling
- Graceful degradation when optional data is missing
- Detailed error messages in development mode
