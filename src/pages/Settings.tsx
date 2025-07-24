import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Save,
  Building2,
  Moon,
  Sun,
  ScanLine,
  Printer,
  Key,
  Download,
  Upload,
  Shield,
  Bell,
  Globe
} from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    // Company Profile
    companyName: "StockAI Pro Warehouse",
    companyAddress: "123 Business Street, Tech City, TC 12345",
    companyPhone: "+91 98765 43210",
    companyEmail: "contact@stockaipro.com",
    companyGST: "22ABCDE1234F1Z5",
    companyLogo: null,

    // GST Settings
    gstEnabled: true,
    gstRate: 18,
    hsnCodeRequired: true,

    // Bill Scanning
    billScanningEnabled: true,
    ocrProvider: "google", // google, aws, azure
    autoStockUpdate: true,
    confidenceThreshold: 85,

    // Theme & Display
    darkMode: false,
    language: "english",
    currency: "INR",
    dateFormat: "DD/MM/YYYY",

    // Notifications
    lowStockAlerts: true,
    expiryAlerts: true,
    emailNotifications: true,
    salesReportFrequency: "weekly",

    // Printer Settings
    defaultPrinter: "HP LaserJet Pro",
    billFormat: "a4",
    logoOnBills: true,
    
    // Prophet AI API
    prophetApiKey: "",
    forecastEnabled: true,
    forecastPeriod: 30 // days
  });

  const handleSave = () => {
    console.log("Saving settings:", settings);
    // In real app, save to backend/localStorage
  };

  const handleBackup = () => {
    console.log("Creating backup...");
    // Export settings and data
  };

  const handleRestore = () => {
    console.log("Restoring from backup...");
    // Import settings and data
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSettings({...settings, companyLogo: file.name});
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your warehouse management system</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={handleBackup}>
            <Download className="h-4 w-4" />
            Backup
          </Button>
          <Button variant="secondary" size="lg" onClick={handleRestore}>
            <Upload className="h-4 w-4" />
            Restore
          </Button>
          <Button variant="action" size="lg" onClick={handleSave}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="gst">GST</TabsTrigger>
          <TabsTrigger value="scanning">Scanning</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="notifications">Alerts</TabsTrigger>
          <TabsTrigger value="ai">AI & API</TabsTrigger>
        </TabsList>

        {/* Company Profile */}
        <TabsContent value="company">
          <Card className="p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Company Profile</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium">Company Name</label>
                <Input
                  value={settings.companyName}
                  onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({...settings, companyPhone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({...settings, companyEmail: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">GST Number</label>
                <Input
                  value={settings.companyGST}
                  onChange={(e) => setSettings({...settings, companyGST: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Textarea
                  value={settings.companyAddress}
                  onChange={(e) => setSettings({...settings, companyAddress: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Company Logo</label>
                <div className="flex gap-3 mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Button variant="outline" onClick={() => document.getElementById('logo-upload').click()}>
                    <Upload className="h-4 w-4" />
                    Upload Logo
                  </Button>
                  {settings.companyLogo && (
                    <span className="text-sm text-muted-foreground self-center">
                      {settings.companyLogo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* GST Settings */}
        <TabsContent value="gst">
          <Card className="p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">GST Configuration</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable GST</h4>
                  <p className="text-sm text-muted-foreground">Apply GST to all transactions</p>
                </div>
                <Switch
                  checked={settings.gstEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, gstEnabled: checked})}
                />
              </div>
              
              {settings.gstEnabled && (
                <>
                  <div>
                    <label className="text-sm font-medium">Default GST Rate (%)</label>
                    <Input
                      type="number"
                      value={settings.gstRate}
                      onChange={(e) => setSettings({...settings, gstRate: Number(e.target.value)})}
                      className="w-32"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">HSN Code Required</h4>
                      <p className="text-sm text-muted-foreground">Require HSN codes for products</p>
                    </div>
                    <Switch
                      checked={settings.hsnCodeRequired}
                      onCheckedChange={(checked) => setSettings({...settings, hsnCodeRequired: checked})}
                    />
                  </div>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Bill Scanning */}
        <TabsContent value="scanning">
          <Card className="p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <ScanLine className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Bill Scanning & OCR</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable Bill Scanning</h4>
                  <p className="text-sm text-muted-foreground">Use OCR to extract data from bills</p>
                </div>
                <Switch
                  checked={settings.billScanningEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, billScanningEnabled: checked})}
                />
              </div>

              {settings.billScanningEnabled && (
                <>
                  <div>
                    <label className="text-sm font-medium">OCR Provider</label>
                    <Select value={settings.ocrProvider} onValueChange={(value) => setSettings({...settings, ocrProvider: value})}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Cloud Vision</SelectItem>
                        <SelectItem value="aws">AWS Textract</SelectItem>
                        <SelectItem value="azure">Azure Computer Vision</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Confidence Threshold (%)</label>
                    <Input
                      type="number"
                      min="50"
                      max="100"
                      value={settings.confidenceThreshold}
                      onChange={(e) => setSettings({...settings, confidenceThreshold: Number(e.target.value)})}
                      className="w-32"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto Stock Update</h4>
                      <p className="text-sm text-muted-foreground">Automatically update inventory from bills</p>
                    </div>
                    <Switch
                      checked={settings.autoStockUpdate}
                      onCheckedChange={(checked) => setSettings({...settings, autoStockUpdate: checked})}
                    />
                  </div>
                </>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Display & Theme */}
        <TabsContent value="display">
          <Card className="p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <Sun className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Display & Theme</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Dark Mode</h4>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => setSettings({...settings, darkMode: checked})}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Language</label>
                <Select value={settings.language} onValueChange={(value) => setSettings({...settings, language: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="marathi">Marathi</SelectItem>
                    <SelectItem value="gujarati">Gujarati</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Currency</label>
                <Select value={settings.currency} onValueChange={(value) => setSettings({...settings, currency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Date Format</label>
                <Select value={settings.dateFormat} onValueChange={(value) => setSettings({...settings, dateFormat: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Notifications & Alerts</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Low Stock Alerts</h4>
                  <p className="text-sm text-muted-foreground">Get notified when stock is low</p>
                </div>
                <Switch
                  checked={settings.lowStockAlerts}
                  onCheckedChange={(checked) => setSettings({...settings, lowStockAlerts: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Expiry Alerts</h4>
                  <p className="text-sm text-muted-foreground">Get notified of expiring products</p>
                </div>
                <Switch
                  checked={settings.expiryAlerts}
                  onCheckedChange={(checked) => setSettings({...settings, expiryAlerts: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">Send notifications via email</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Sales Report Frequency</label>
                <Select value={settings.salesReportFrequency} onValueChange={(value) => setSettings({...settings, salesReportFrequency: value})}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* AI & API */}
        <TabsContent value="ai">
          <Card className="p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-6">
              <Key className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">AI & API Configuration</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable Demand Forecasting</h4>
                  <p className="text-sm text-muted-foreground">Use Prophet ML model for predictions</p>
                </div>
                <Switch
                  checked={settings.forecastEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, forecastEnabled: checked})}
                />
              </div>

              {settings.forecastEnabled && (
                <>
                  <div>
                    <label className="text-sm font-medium">Prophet API Key</label>
                    <Input
                      type="password"
                      placeholder="Enter Prophet ML API key"
                      value={settings.prophetApiKey}
                      onChange={(e) => setSettings({...settings, prophetApiKey: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Connect to Prophet ML service for demand forecasting
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Forecast Period (Days)</label>
                    <Select 
                      value={String(settings.forecastPeriod)} 
                      onValueChange={(value) => setSettings({...settings, forecastPeriod: Number(value)})}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                        <SelectItem value="90">90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <h4 className="font-medium mb-3">Printer Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Default Printer</label>
                    <Input
                      value={settings.defaultPrinter}
                      onChange={(e) => setSettings({...settings, defaultPrinter: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Bill Format</label>
                    <Select value={settings.billFormat} onValueChange={(value) => setSettings({...settings, billFormat: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="thermal">Thermal</SelectItem>
                        <SelectItem value="dot-matrix">Dot Matrix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <h4 className="font-medium">Include Logo on Bills</h4>
                    <p className="text-sm text-muted-foreground">Print company logo on bills</p>
                  </div>
                  <Switch
                    checked={settings.logoOnBills}
                    onCheckedChange={(checked) => setSettings({...settings, logoOnBills: checked})}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}