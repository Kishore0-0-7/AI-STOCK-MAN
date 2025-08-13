# Stock Summary API Documentation

## Overview
The Stock Summary API provides comprehensive inventory management endpoints for retrieving stock information, analytics, and movement tracking data.

## Base URL
```
http://localhost:5000/api/v1/stock-summary
```

## Endpoints

### 1. Get Stock Summary
**GET** `/`

Retrieves a paginated list of stock items with detailed information including stock levels, pricing, performance metrics, and supplier details.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of items per page |
| `search` | string | "" | Search term for name, SKU, or supplier |
| `category` | string | "all" | Filter by product category |
| `stockFilter` | string | "all" | Filter by stock status: "all", "in_stock", "low_stock", "out_of_stock" |
| `sortBy` | string | "name" | Sort field: "name", "stock", "value", "turnover", "lastMovement" |
| `sortOrder` | string | "asc" | Sort direction: "asc" or "desc" |

#### Example Request
```bash
GET /api/v1/stock-summary?page=1&limit=20&search=iron&category=Iron%20Castings&stockFilter=low_stock&sortBy=stock&sortOrder=desc
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "product-uuid-123",
        "name": "Iron Casting Blocks - Grade A",
        "category": "Iron Castings",
        "sku": "ICB-GA-001",
        "currentStock": 120,
        "reorderLevel": 50,
        "maxStock": 300,
        "unit": "kg",
        "costPrice": 12000,
        "sellingPrice": 15000,
        "supplier": "SteelWorks Industries",
        "lastRestocked": "2024-01-18T10:30:00.000Z",
        "expiryDate": null,
        "location": "Warehouse-A-01",
        "stockValue": 1440000,
        "stockTurnover": 8.5,
        "daysSinceLastMovement": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    },
    "stats": {
      "total": 156,
      "inStock": 120,
      "lowStock": 25,
      "outOfStock": 11,
      "totalValue": 25430000,
      "avgTurnover": 7.8
    },
    "categories": [
      "Iron Castings",
      "Aluminum Castings",
      "Bronze Castings",
      "Steel Castings",
      "Brass Castings"
    ]
  }
}
```

### 2. Get Product Movements
**GET** `/movements/:productId`

Retrieves stock movement history for a specific product.

#### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `productId` | string | UUID of the product |

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Number of movements to retrieve |

#### Example Request
```bash
GET /api/v1/stock-summary/movements/product-uuid-123?limit=10
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "movements": [
      {
        "id": "movement-uuid-456",
        "date": "2024-01-22T14:30:00.000Z",
        "type": "Sale",
        "quantity": -30,
        "balance": 120,
        "reference": "INV-2024-001",
        "reason": "Customer order fulfillment",
        "notes": null,
        "createdBy": "user@example.com"
      },
      {
        "id": "movement-uuid-789",
        "date": "2024-01-18T09:15:00.000Z",
        "type": "Purchase",
        "quantity": 100,
        "balance": 150,
        "reference": "PO-2024-003",
        "reason": "Inventory replenishment",
        "notes": "Received full order",
        "createdBy": "purchasing@example.com"
      }
    ]
  }
}
```

### 3. Get Movement Trends
**GET** `/trends`

Retrieves stock movement trends for analytics and reporting.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 7 | Number of days to analyze |

#### Example Request
```bash
GET /api/v1/stock-summary/trends?days=30
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "date": "2024-01-16",
        "stockIn": 1500,
        "stockOut": 850,
        "net": 650
      },
      {
        "date": "2024-01-17",
        "stockIn": 800,
        "stockOut": 1200,
        "net": -400
      }
    ]
  }
}
```

### 4. Get Category Distribution
**GET** `/category-distribution`

Retrieves category-wise stock value distribution for portfolio analysis.

#### Example Request
```bash
GET /api/v1/stock-summary/category-distribution
```

#### Example Response
```json
{
  "success": true,
  "data": {
    "distribution": [
      {
        "category": "Iron Castings",
        "productCount": 45,
        "totalQuantity": 12500,
        "totalValue": 8750000,
        "avgStockLevel": 277.8,
        "lowStockItems": 8
      },
      {
        "category": "Aluminum Castings",
        "productCount": 32,
        "totalQuantity": 8900,
        "totalValue": 6230000,
        "avgStockLevel": 278.1,
        "lowStockItems": 5
      }
    ]
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information (development only)"
}
```

### Common HTTP Status Codes
- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Stock Status Values

The `stockFilter` parameter accepts these values:
- `all` - All products regardless of stock level
- `in_stock` - Products with stock above reorder level
- `low_stock` - Products with stock at or below reorder level but not zero
- `out_of_stock` - Products with zero stock

## Sort Options

The `sortBy` parameter accepts these values:
- `name` - Sort by product name
- `stock` - Sort by current stock level
- `value` - Sort by total stock value
- `turnover` - Sort by stock turnover ratio
- `lastMovement` - Sort by days since last movement

## Performance Notes

- The API includes optimized queries with proper indexing
- Pagination is recommended for large datasets
- Complex calculations (turnover ratios) are cached where possible
- Movement history is limited to recent records for performance

## Integration Example

Here's a TypeScript example of how to integrate with the frontend:

```typescript
interface StockSummaryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockFilter?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  sortBy?: 'name' | 'stock' | 'value' | 'turnover' | 'lastMovement';
  sortOrder?: 'asc' | 'desc';
}

async function fetchStockSummary(params: StockSummaryParams) {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value.toString());
    }
  });
  
  const response = await fetch(`/api/v1/stock-summary?${queryParams}`);
  return response.json();
}
```
