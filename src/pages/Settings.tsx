import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Save } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure your warehouse management system</p>
        </div>
        <Button variant="action" size="lg">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>
      
      <Card className="p-12 text-center shadow-soft">
        <SettingsIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Settings Panel Coming Soon</h3>
        <p className="text-muted-foreground">Company profile, theme settings, and system configuration</p>
      </Card>
    </div>
  );
}