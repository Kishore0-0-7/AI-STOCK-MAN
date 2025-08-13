import React, { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import {
  productionCalculatorAPI,
  type RawMaterial,
  type ProductRecipe,
  type ProductionCalculation,
  type ProductionBatch,
  type InventoryAnalytics,
} from "@/services/api";
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

// Types for our production calculator - using MaterialRequirement from API
interface MaterialRequirement {
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  wastagePercent: number;
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

const ProductionCalculator: React.FC = () => {
  const isMobile = useIsMobile();

  // State management
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<ProductRecipe[]>([]);
  const [calculations, setCalculations] = useState<ProductionCalculation[]>([]);
  const [productionBatches, setBatches] = useState<ProductionBatch[]>([]);
  const [analytics, setAnalytics] = useState<InventoryAnalytics | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [requestedQuantity, setRequestedQuantity] = useState<number>(1);
  const [loading, setLoading] = useState({
    materials: false,
    products: false,
    calculating: false,
  });
  const [activeTab, setActiveTab] = useState<string>("calculator");
  const { toast } = useToast();

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  // Fetch data functions
  const fetchRawMaterials = async () => {
    setLoading((prev) => ({ ...prev, materials: true }));
    try {
      const response = await productionCalculatorAPI.getRawMaterials();
      setRawMaterials(response);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      toast({
        title: "Error",
        description: "Failed to fetch raw materials",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, materials: false }));
    }
  };

  const fetchProducts = async () => {
    setLoading((prev) => ({ ...prev, products: true }));
    try {
      const response = await productionCalculatorAPI.getProducts();
      setProducts(response);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, products: false }));
    }
  };

  const fetchProductionBatches = async () => {
    try {
      const response = await productionCalculatorAPI.getProductionBatches();
      setBatches(response);
    } catch (error) {
      console.error("Error fetching production batches:", error);
      toast({
        title: "Error",
        description: "Failed to fetch production batches",
        variant: "destructive",
      });
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await productionCalculatorAPI.getInventoryAnalytics();
      setAnalytics(response);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    }
  };

  // Calculate production feasibility
  const calculateProduction = async () => {
    if (!selectedProduct || requestedQuantity <= 0) return;

    setLoading((prev) => ({ ...prev, calculating: true }));
    try {
      const response = await productionCalculatorAPI.calculateProduction(
        selectedProduct,
        requestedQuantity
      );

      setCalculations((prev) => [response, ...prev.slice(0, 4)]);

      toast({
        title: "Calculation Complete",
        description: response.feasible
          ? `Production is feasible! Cost: ₹${response.totalCost.toFixed(2)}`
          : "Production has constraints. Check material requirements.",
        variant: response.feasible ? "default" : "destructive",
      });
    } catch (error) {
      console.error("Error calculating production:", error);
      toast({
        title: "Error",
        description: "Failed to calculate production requirements",
        variant: "destructive",
      });
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
    fetchAnalytics();
  }, []);

  // Chart data preparation
  const stockAnalysisData = analytics?.stockAnalysis || [];
  const categoryDistribution = analytics?.categoryDistribution || [];

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 bg-gradient-to-br from-background to-muted/20 min-h-screen max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
        <div className="w-full lg:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Calculator className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-600" />
            </div>
            <span className="break-words leading-tight">
              Production Calculator
            </span>
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-1">
            Calculate raw material requirements and production feasibility
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => {
              fetchRawMaterials();
              fetchProducts();
              fetchProductionBatches();
              fetchAnalytics();
            }}
            variant="outline"
            size="sm"
            className="gap-2 flex-1 sm:flex-initial"
          >
            <RefreshCw className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 flex-1 sm:flex-initial"
          >
            <Download className="h-4 w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow duration-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                <span className="hidden xs:inline">Raw Materials</span>
                <span className="xs:hidden">Materials</span>
              </p>
              <div className="text-lg sm:text-2xl font-bold">
                {rawMaterials.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {
                  rawMaterials.filter((m) => m.currentStock <= m.reorderLevel)
                    .length
                }{" "}
                <span className="hidden sm:inline">low stock</span>
                <span className="sm:hidden">low</span>
              </p>
            </div>
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0 opacity-60" />
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Factory className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                <span className="hidden xs:inline">Products</span>
                <span className="xs:hidden">Products</span>
              </p>
              <div className="text-lg sm:text-2xl font-bold">
                {products.length}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">available designs</span>
                <span className="sm:hidden">designs</span>
              </p>
            </div>
            <Factory className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0 opacity-60" />
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 p-4 sm:p-6 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 flex-shrink-0" />
                <span className="hidden xs:inline">Calculations</span>
                <span className="xs:hidden">Calcs</span>
              </p>
              <div className="text-lg sm:text-2xl font-bold">
                {calculations.length}
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">completed</span>
                <span className="sm:hidden">done</span>
              </p>
            </div>
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0 opacity-60" />
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 p-4 sm:p-6 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 flex-shrink-0" />
                <span className="hidden xs:inline">Active Batches</span>
                <span className="xs:hidden">Batches</span>
              </p>
              <div className="text-lg sm:text-2xl font-bold">
                {
                  productionBatches.filter((b) => b.status === "In Progress")
                    .length
                }
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="hidden sm:inline">in production</span>
                <span className="sm:hidden">active</span>
              </p>
            </div>
            <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 flex-shrink-0 opacity-60" />
          </div>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-4">
          <TabsTrigger
            value="calculator"
            className="text-xs sm:text-sm px-2 py-2"
          >
            <Calculator className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="hidden xs:inline">Calculator</span>
            <span className="xs:hidden">Calc</span>
          </TabsTrigger>
          <TabsTrigger
            value="materials"
            className="text-xs sm:text-sm px-2 py-2"
          >
            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="hidden xs:inline">Materials</span>
            <span className="xs:hidden">Mat</span>
          </TabsTrigger>
          <TabsTrigger value="batches" className="text-xs sm:text-sm px-2 py-2">
            <Factory className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="hidden xs:inline">Batches</span>
            <span className="xs:hidden">Batch</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="text-xs sm:text-sm px-2 py-2"
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
            <span className="hidden xs:inline">Analytics</span>
            <span className="xs:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* Production Calculator Tab */}
        <TabsContent value="calculator" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Input Section */}
            <Card className="w-full lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Wrench className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span>Production Setup</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Configure your production requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="product-select"
                    className="text-sm font-medium"
                  >
                    Select Product
                  </Label>
                  <Select
                    value={selectedProduct}
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger className="w-full">
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
            <div className="w-full lg:col-span-2 space-y-4">
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
        <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Stock Levels Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  Stock Levels Analysis
                </CardTitle>
                <CardDescription className="text-sm">
                  Current stock vs reorder levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stockAnalysisData}
                      margin={{
                        top: 5,
                        right: isMobile ? 5 : 10,
                        left: isMobile ? 5 : 10,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: isMobile ? 8 : 10 }}
                        interval={isMobile ? "preserveStartEnd" : 0}
                      />
                      <YAxis tick={{ fontSize: isMobile ? 8 : 10 }} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          fontSize: isMobile ? "12px" : "14px",
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
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  Inventory Value Distribution
                </CardTitle>
                <CardDescription className="text-sm">
                  Stock value by material category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 sm:h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={
                          !isMobile
                            ? ({ name, percent }) =>
                                `${name}: ${(percent * 100).toFixed(0)}%`
                            : false
                        }
                        outerRadius={isMobile ? 60 : 80}
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
                          fontSize: isMobile ? "12px" : "14px",
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
                      analytics?.summary.totalInventoryValue || 0
                    )}
                  </div>
                  <div className="text-sm text-blue-700">
                    Total Inventory Value
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {analytics?.summary.lowStockCount || 0}
                  </div>
                  <div className="text-sm text-red-700">Low Stock Items</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics?.summary.wellStockedCount || 0}
                  </div>
                  <div className="text-sm text-green-700">
                    Well Stocked Items
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(analytics?.summary.restockInvestment || 0)}
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
