import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calculator,
  Package,
  Factory,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  RefreshCw,
  Download,
  Zap,
  BarChart3,
  Clock,
  IndianRupee,
  Wrench,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Types for our production calculator
interface RawMaterial {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  costPerUnit: number;
  reorderLevel: number;
  supplier: string;
  category: string;
  lastUpdated: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  estimatedTime: number; // in hours
  complexity: "Low" | "Medium" | "High";
  materials: MaterialRequirement[];
}

interface MaterialRequirement {
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  wastagePercent: number;
}

interface ProductionCalculation {
  productId: string;
  productName: string;
  requestedQuantity: number;
  possibleQuantity: number;
  totalCost: number;
  estimatedTime: number;
  materialBreakdown: MaterialBreakdown[];
  feasible: boolean;
  bottlenecks: string[];
}

interface MaterialBreakdown {
  materialId: string;
  materialName: string;
  required: number;
  available: number;
  shortage: number;
  cost: number;
  unit: string;
}

interface ProductionBatch {
  id: string;
  productName: string;
  quantity: number;
  status: "Planned" | "In Progress" | "Completed" | "On Hold";
  startDate: string;
  estimatedCompletion: string;
  progress: number;
  materials: MaterialBreakdown[];
}

const ProductionCalculator: React.FC = () => {
  // State management
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [calculations, setCalculations] = useState<ProductionCalculation[]>([]);
  const [productionBatches, setBatches] = useState<ProductionBatch[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [requestedQuantity, setRequestedQuantity] = useState<number>(1);
  const [loading, setLoading] = useState({
    materials: false,
    products: false,
    calculating: false,
  });
  const [activeTab, setActiveTab] = useState<string>("calculator");

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  // Fetch data functions
  const fetchRawMaterials = async () => {
    setLoading((prev) => ({ ...prev, materials: true }));
    try {
      // Simulate API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockMaterials: RawMaterial[] = [
        {
          id: "steel_rod",
          name: "Steel Rod",
          currentStock: 50,
          unit: "kg",
          costPerUnit: 85,
          reorderLevel: 20,
          supplier: "MetalCorp",
          category: "Metal",
          lastUpdated: new Date().toISOString(),
        },
        {
          id: "cement_bag",
          name: "Cement Bag",
          currentStock: 30,
          unit: "bags",
          costPerUnit: 450,
          reorderLevel: 15,
          supplier: "CementCo",
          category: "Building Material",
          lastUpdated: new Date().toISOString(),
        },
        {
          id: "sand",
          name: "Sand",
          currentStock: 200,
          unit: "cubic ft",
          costPerUnit: 25,
          reorderLevel: 50,
          supplier: "SandSupply",
          category: "Aggregate",
          lastUpdated: new Date().toISOString(),
        },
        {
          id: "gravel",
          name: "Gravel",
          currentStock: 150,
          unit: "cubic ft",
          costPerUnit: 35,
          reorderLevel: 40,
          supplier: "StoneWorks",
          category: "Aggregate",
          lastUpdated: new Date().toISOString(),
        },
        {
          id: "iron_powder",
          name: "Iron Powder",
          currentStock: 25,
          unit: "kg",
          costPerUnit: 120,
          reorderLevel: 10,
          supplier: "IronWorks Ltd",
          category: "Metal",
          lastUpdated: new Date().toISOString(),
        },
      ];
      setRawMaterials(mockMaterials);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    } finally {
      setLoading((prev) => ({ ...prev, materials: false }));
    }
  };

  const fetchProducts = async () => {
    setLoading((prev) => ({ ...prev, products: true }));
    try {
      // Simulate API call with mock data
      await new Promise((resolve) => setTimeout(resolve, 800));
      const mockProducts: Product[] = [
        {
          id: "concrete_block",
          name: "Concrete Block",
          category: "Building Material",
          description: "Standard concrete block for construction",
          estimatedTime: 2,
          complexity: "Low",
          materials: [
            {
              materialId: "cement_bag",
              materialName: "Cement Bag",
              requiredQuantity: 0.5,
              unit: "bags",
              wastagePercent: 5,
            },
            {
              materialId: "sand",
              materialName: "Sand",
              requiredQuantity: 10,
              unit: "cubic ft",
              wastagePercent: 3,
            },
            {
              materialId: "gravel",
              materialName: "Gravel",
              requiredQuantity: 8,
              unit: "cubic ft",
              wastagePercent: 2,
            },
          ],
        },
        {
          id: "steel_beam",
          name: "Steel Beam",
          category: "Structural",
          description: "Reinforced steel beam for construction",
          estimatedTime: 4,
          complexity: "High",
          materials: [
            {
              materialId: "steel_rod",
              materialName: "Steel Rod",
              requiredQuantity: 15,
              unit: "kg",
              wastagePercent: 8,
            },
            {
              materialId: "iron_powder",
              materialName: "Iron Powder",
              requiredQuantity: 2,
              unit: "kg",
              wastagePercent: 10,
            },
          ],
        },
        {
          id: "casting_mold",
          name: "Casting Mold",
          category: "Tools",
          description: "Metal casting mold for manufacturing",
          estimatedTime: 6,
          complexity: "Medium",
          materials: [
            {
              materialId: "steel_rod",
              materialName: "Steel Rod",
              requiredQuantity: 8,
              unit: "kg",
              wastagePercent: 5,
            },
            {
              materialId: "sand",
              materialName: "Sand",
              requiredQuantity: 15,
              unit: "cubic ft",
              wastagePercent: 4,
            },
          ],
        },
        {
          id: "foundation_slab",
          name: "Foundation Slab",
          category: "Foundation",
          description: "Pre-cast foundation slab",
          estimatedTime: 8,
          complexity: "High",
          materials: [
            {
              materialId: "cement_bag",
              materialName: "Cement Bag",
              requiredQuantity: 2,
              unit: "bags",
              wastagePercent: 3,
            },
            {
              materialId: "steel_rod",
              materialName: "Steel Rod",
              requiredQuantity: 20,
              unit: "kg",
              wastagePercent: 7,
            },
            {
              materialId: "sand",
              materialName: "Sand",
              requiredQuantity: 25,
              unit: "cubic ft",
              wastagePercent: 2,
            },
            {
              materialId: "gravel",
              materialName: "Gravel",
              requiredQuantity: 30,
              unit: "cubic ft",
              wastagePercent: 3,
            },
          ],
        },
      ];
      setProducts(mockProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading((prev) => ({ ...prev, products: false }));
    }
  };

  const fetchProductionBatches = async () => {
    try {
      const mockBatches: ProductionBatch[] = [
        {
          id: "batch_001",
          productName: "Concrete Block",
          quantity: 50,
          status: "In Progress",
          startDate: "2025-08-10",
          estimatedCompletion: "2025-08-15",
          progress: 65,
          materials: [
            {
              materialId: "cement_bag",
              materialName: "Cement Bag",
              required: 25,
              available: 30,
              shortage: 0,
              cost: 11250,
              unit: "bags",
            },
            {
              materialId: "sand",
              materialName: "Sand",
              required: 500,
              available: 200,
              shortage: 300,
              cost: 12500,
              unit: "cubic ft",
            },
          ],
        },
        {
          id: "batch_002",
          productName: "Steel Beam",
          quantity: 10,
          status: "Planned",
          startDate: "2025-08-16",
          estimatedCompletion: "2025-08-20",
          progress: 0,
          materials: [
            {
              materialId: "steel_rod",
              materialName: "Steel Rod",
              required: 150,
              available: 50,
              shortage: 100,
              cost: 12750,
              unit: "kg",
            },
          ],
        },
      ];
      setBatches(mockBatches);
    } catch (error) {
      console.error("Error fetching production batches:", error);
    }
  };

  // Calculate production feasibility
  const calculateProduction = async () => {
    if (!selectedProduct || requestedQuantity <= 0) return;

    setLoading((prev) => ({ ...prev, calculating: true }));
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const product = products.find((p) => p.id === selectedProduct);
      if (!product) return;

      const materialBreakdown: MaterialBreakdown[] = [];
      const bottlenecks: string[] = [];
      let totalCost = 0;
      let possibleQuantity = requestedQuantity;

      for (const requirement of product.materials) {
        const material = rawMaterials.find(
          (m) => m.id === requirement.materialId
        );
        if (!material) continue;

        const requiredWithWastage =
          requirement.requiredQuantity * (1 + requirement.wastagePercent / 100);
        const totalRequired = requiredWithWastage * requestedQuantity;
        const shortage = Math.max(0, totalRequired - material.currentStock);
        const availableForProduction = Math.floor(
          material.currentStock / requiredWithWastage
        );

        if (availableForProduction < requestedQuantity) {
          possibleQuantity = Math.min(possibleQuantity, availableForProduction);
          bottlenecks.push(
            `${material.name} (Available: ${material.currentStock} ${
              material.unit
            }, Required: ${totalRequired.toFixed(2)} ${material.unit})`
          );
        }

        const costForPossible =
          requiredWithWastage * possibleQuantity * material.costPerUnit;
        totalCost += costForPossible;

        materialBreakdown.push({
          materialId: material.id,
          materialName: material.name,
          required: totalRequired,
          available: material.currentStock,
          shortage,
          cost: costForPossible,
          unit: material.unit,
        });
      }

      const calculation: ProductionCalculation = {
        productId: product.id,
        productName: product.name,
        requestedQuantity,
        possibleQuantity,
        totalCost,
        estimatedTime: product.estimatedTime * possibleQuantity,
        materialBreakdown,
        feasible: possibleQuantity === requestedQuantity,
        bottlenecks,
      };

      setCalculations((prev) => [calculation, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error("Error calculating production:", error);
    } finally {
      setLoading((prev) => ({ ...prev, calculating: false }));
    }
  };

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (current: number, reorder: number) => {
    if (current === 0)
      return {
        status: "Out of Stock",
        color: "bg-red-500",
        textColor: "text-red-700",
      };
    if (current <= reorder)
      return {
        status: "Low Stock",
        color: "bg-orange-500",
        textColor: "text-orange-700",
      };
    if (current <= reorder * 2)
      return {
        status: "Medium Stock",
        color: "bg-yellow-500",
        textColor: "text-yellow-700",
      };
    return {
      status: "Good Stock",
      color: "bg-green-500",
      textColor: "text-green-700",
    };
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Low":
        return "bg-green-100 text-green-800 border-green-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "High":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchRawMaterials();
    fetchProducts();
    fetchProductionBatches();
  }, []);

  // Chart data preparation
  const stockAnalysisData = rawMaterials.map((material) => ({
    name: material.name.split(" ")[0],
    current: material.currentStock,
    reorder: material.reorderLevel,
    cost: material.costPerUnit,
  }));

  const categoryDistribution = rawMaterials.reduce((acc, material) => {
    const existing = acc.find((item) => item.name === material.category);
    if (existing) {
      existing.value += material.currentStock * material.costPerUnit;
    } else {
      acc.push({
        name: material.category,
        value: material.currentStock * material.costPerUnit,
      });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <span className="truncate">Production Calculator</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Calculate raw material requirements and production feasibility
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchRawMaterials}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              Raw Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {rawMaterials.length}
            </div>
            <p className="text-xs text-gray-500">
              {
                rawMaterials.filter((m) => m.currentStock <= m.reorderLevel)
                  .length
              }{" "}
              low stock
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Factory className="h-4 w-4 text-green-600" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {products.length}
            </div>
            <p className="text-xs text-gray-500">Available for production</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-orange-600" />
              Total Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(
                rawMaterials.reduce(
                  (sum, m) => sum + m.currentStock * m.costPerUnit,
                  0
                )
              )}
            </div>
            <p className="text-xs text-gray-500">Current inventory</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              Active Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {
                productionBatches.filter((b) => b.status === "In Progress")
                  .length
              }
            </div>
            <p className="text-xs text-gray-500">
              {productionBatches.filter((b) => b.status === "Planned").length}{" "}
              planned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="calculator" className="text-xs sm:text-sm">
            <Calculator className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Calculator</span>
            <span className="sm:hidden">Calc</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="text-xs sm:text-sm">
            <Package className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Materials</span>
            <span className="sm:hidden">Stock</span>
          </TabsTrigger>
          <TabsTrigger value="batches" className="text-xs sm:text-sm">
            <Factory className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Batches</span>
            <span className="sm:hidden">Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* Production Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Section */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  Production Setup
                </CardTitle>
                <CardDescription>
                  Configure your production requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-select">Select Product</Label>
                  <Select
                    value={selectedProduct}
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{product.name}</span>
                            <Badge
                              className={`ml-2 ${getComplexityColor(
                                product.complexity
                              )}`}
                            >
                              {product.complexity}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Required Quantity</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        setRequestedQuantity(Math.max(1, requestedQuantity - 1))
                      }
                      disabled={requestedQuantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      value={requestedQuantity}
                      onChange={(e) =>
                        setRequestedQuantity(
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="text-center"
                      min="1"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        setRequestedQuantity(requestedQuantity + 1)
                      }
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {selectedProduct && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="text-sm font-medium">Product Details:</div>
                    <div className="text-xs text-gray-600">
                      {
                        products.find((p) => p.id === selectedProduct)
                          ?.description
                      }
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Est. Time per Unit:</span>
                      <span>
                        {
                          products.find((p) => p.id === selectedProduct)
                            ?.estimatedTime
                        }
                        h
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Total Est. Time:</span>
                      <span>
                        {(products.find((p) => p.id === selectedProduct)
                          ?.estimatedTime || 0) * requestedQuantity}
                        h
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  onClick={calculateProduction}
                  disabled={!selectedProduct || loading.calculating}
                  className="w-full"
                >
                  {loading.calculating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Requirements
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            <div className="lg:col-span-2 space-y-4">
              {calculations.length > 0 ? (
                calculations.map((calc, index) => (
                  <Card key={index} className="w-full">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <CardTitle className="flex items-center gap-2">
                          {calc.feasible ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          {calc.productName}
                        </CardTitle>
                        <Badge
                          className={
                            calc.feasible
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {calc.feasible ? "Feasible" : "Limited"}
                        </Badge>
                      </div>
                      <CardDescription>
                        Requested: {calc.requestedQuantity} | Possible:{" "}
                        {calc.possibleQuantity} | Cost:{" "}
                        {formatCurrency(calc.totalCost)} | Time:{" "}
                        {calc.estimatedTime}h
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!calc.feasible && calc.bottlenecks.length > 0 && (
                        <Alert className="mb-4 border-orange-200 bg-orange-50">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <AlertDescription className="text-sm">
                            <strong>Production Constraints:</strong>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              {calc.bottlenecks.map((bottleneck, idx) => (
                                <li key={idx} className="text-xs">
                                  {bottleneck}
                                </li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">
                          Material Breakdown:
                        </h4>
                        <div className="space-y-2">
                          {calc.materialBreakdown.map((material, idx) => (
                            <div key={idx} className="p-3 border rounded-lg">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                                <span className="font-medium text-sm">
                                  {material.materialName}
                                </span>
                                <div className="flex gap-2 text-xs">
                                  <Badge
                                    variant={
                                      material.shortage > 0
                                        ? "destructive"
                                        : "secondary"
                                    }
                                  >
                                    {material.shortage > 0
                                      ? `Short: ${material.shortage.toFixed(2)}`
                                      : "Available"}
                                  </Badge>
                                  <span className="text-gray-600">
                                    {formatCurrency(material.cost)}
                                  </span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                                <div>
                                  Required: {material.required.toFixed(2)}{" "}
                                  {material.unit}
                                </div>
                                <div>
                                  Available: {material.available}{" "}
                                  {material.unit}
                                </div>
                                <div className="sm:col-span-2">
                                  <Progress
                                    value={Math.min(
                                      100,
                                      (material.available / material.required) *
                                        100
                                    )}
                                    className="h-2 mt-1"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <div className="text-center text-gray-500">
                      <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>
                        Select a product and click "Calculate Requirements" to
                        see results
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Raw Materials Tab */}
        <TabsContent value="materials" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading.materials
              ? Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-16 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </CardContent>
                  </Card>
                ))
              : rawMaterials.map((material) => {
                  const stockStatus = getStockStatus(
                    material.currentStock,
                    material.reorderLevel
                  );
                  return (
                    <Card
                      key={material.id}
                      className="hover:shadow-md transition-shadow duration-200"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-sm font-medium truncate pr-2">
                            {material.name}
                          </CardTitle>
                          <Badge
                            className={`${stockStatus.color} text-white text-xs px-2 py-1 shrink-0`}
                          >
                            {stockStatus.status.split(" ")[0]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Stock:</span>
                            <span className="font-medium">
                              {material.currentStock} {material.unit}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Cost:</span>
                            <span className="font-medium">
                              {formatCurrency(material.costPerUnit)}/
                              {material.unit}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Reorder:</span>
                            <span className="font-medium">
                              {material.reorderLevel} {material.unit}
                            </span>
                          </div>
                        </div>

                        <Progress
                          value={
                            (material.currentStock /
                              (material.reorderLevel * 3)) *
                            100
                          }
                          className="h-2"
                        />

                        <div className="pt-2 border-t">
                          <div className="text-xs text-gray-600 mb-1">
                            Supplier: {material.supplier}
                          </div>
                          <div className="text-xs text-gray-500">
                            Category: {material.category}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>
        </TabsContent>

        {/* Production Batches Tab */}
        <TabsContent value="batches" className="space-y-6">
          <div className="space-y-4">
            {productionBatches.map((batch) => (
              <Card key={batch.id} className="w-full">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Factory className="h-5 w-5 text-blue-600" />
                        {batch.productName}
                      </CardTitle>
                      <CardDescription>
                        Quantity: {batch.quantity} | Start: {batch.startDate} |
                        Est. Completion: {batch.estimatedCompletion}
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        batch.status === "In Progress"
                          ? "bg-blue-100 text-blue-800"
                          : batch.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : batch.status === "Planned"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {batch.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {batch.status === "In Progress" && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-gray-600">
                          {batch.progress}%
                        </span>
                      </div>
                      <Progress value={batch.progress} className="h-3" />
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-sm mb-3">
                      Material Requirements:
                    </h4>
                    <div className="space-y-2">
                      {batch.materials.map((material, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded-lg gap-2"
                        >
                          <div>
                            <span className="font-medium text-sm">
                              {material.materialName}
                            </span>
                            <div className="text-xs text-gray-600 mt-1">
                              Required: {material.required} {material.unit} |
                              Available: {material.available} {material.unit}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {material.shortage > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                Short: {material.shortage}
                              </Badge>
                            )}
                            <span className="text-sm font-medium">
                              {formatCurrency(material.cost)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Levels Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Stock Levels Analysis
                </CardTitle>
                <CardDescription>
                  Current stock vs reorder levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stockAnalysisData}
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="current"
                        fill="#3b82f6"
                        name="Current Stock"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="reorder"
                        fill="#ef4444"
                        name="Reorder Level"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Inventory Value Distribution
                </CardTitle>
                <CardDescription>
                  Stock value by material category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number) => [
                          formatCurrency(value),
                          "Value",
                        ]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Summary</CardTitle>
              <CardDescription>Key metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      rawMaterials.reduce(
                        (sum, m) => sum + m.currentStock * m.costPerUnit,
                        0
                      )
                    )}
                  </div>
                  <div className="text-sm text-blue-700">
                    Total Inventory Value
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {
                      rawMaterials.filter(
                        (m) => m.currentStock <= m.reorderLevel
                      ).length
                    }
                  </div>
                  <div className="text-sm text-red-700">Low Stock Items</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {
                      rawMaterials.filter(
                        (m) => m.currentStock > m.reorderLevel * 2
                      ).length
                    }
                  </div>
                  <div className="text-sm text-green-700">
                    Well Stocked Items
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(
                      rawMaterials
                        .reduce(
                          (sum, m) =>
                            sum +
                            (m.reorderLevel - m.currentStock) * m.costPerUnit,
                          0
                        )
                        .toString()
                        .includes("-")
                        ? 0
                        : rawMaterials.reduce(
                            (sum, m) =>
                              sum +
                              Math.max(0, m.reorderLevel - m.currentStock) *
                                m.costPerUnit,
                            0
                          )
                    )}
                  </div>
                  <div className="text-sm text-orange-700">
                    Restock Investment
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionCalculator;
