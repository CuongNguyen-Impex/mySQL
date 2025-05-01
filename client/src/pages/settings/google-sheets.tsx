import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Check, X, Save, RotateCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function GoogleSheetsSettings() {
  const { toast } = useToast();
  
  // Fetch current Google Sheets settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings/google-sheets"],
    onSuccess: (data) => {
      if (data?.spreadsheetId) {
        setSpreadsheetId(data.spreadsheetId);
      }
      if (data?.autoSync !== undefined) {
        setAutoSync(data.autoSync);
      }
    }
  });
  
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [autoSync, setAutoSync] = useState(false);
  
  // Mutations
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/settings/google-sheets", {
        spreadsheetId,
        autoSync
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/google-sheets"] });
      toast({
        title: "Settings Saved",
        description: "Your Google Sheets settings have been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/settings/google-sheets/test", {
        spreadsheetId
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection Successful",
        description: "Connected to Google Sheets successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: `Unable to connect to Google Sheets: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const syncDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/settings/google-sheets/sync");
    },
    onSuccess: () => {
      toast({
        title: "Sync Completed",
        description: "Data has been synchronized with Google Sheets.",
      });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: `Data synchronization failed: ${error}`,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="p-4 lg:p-8">
      <div className="flex items-center mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Google Sheets Integration</h1>
          <p className="text-muted-foreground">
            Configure and manage Google Sheets integration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>
                Connect your LogiCost data to Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="spreadsheet-id">Google Spreadsheet ID</Label>
                    <Input
                      id="spreadsheet-id"
                      value={spreadsheetId}
                      onChange={(e) => setSpreadsheetId(e.target.value)}
                      placeholder="Enter the ID from your Google Spreadsheet URL"
                    />
                    <p className="text-sm text-muted-foreground">
                      Find this in your spreadsheet URL: https://docs.google.com/spreadsheets/d/
                      <span className="font-medium">SPREADSHEET_ID</span>/edit
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-sync">Automatic Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically sync data with Google Sheets on changes
                      </p>
                    </div>
                    <Switch
                      id="auto-sync"
                      checked={autoSync}
                      onCheckedChange={setAutoSync}
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-2">
                    <Label>Connection Status</Label>
                    <div className="flex items-center space-x-2">
                      {settings?.connected ? (
                        <>
                          <div className="h-4 w-4 rounded-full bg-success flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                          <span>Connected to Google Sheets</span>
                        </>
                      ) : (
                        <>
                          <div className="h-4 w-4 rounded-full bg-destructive flex items-center justify-center">
                            <X className="h-3 w-3 text-white" />
                          </div>
                          <span>Not connected</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last synced: {settings?.lastSynced ? new Date(settings.lastSynced).toLocaleString() : "Never"}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => testConnectionMutation.mutate()}
                disabled={!spreadsheetId || testConnectionMutation.isPending}
              >
                Test Connection
              </Button>
              <Button
                onClick={() => saveSettingsMutation.mutate()}
                disabled={!spreadsheetId || saveSettingsMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common operations for Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                variant="secondary"
                onClick={() => syncDataMutation.mutate()}
                disabled={!settings?.connected || syncDataMutation.isPending}
              >
                <RotateCw className="mr-2 h-4 w-4" />
                Sync Data Now
              </Button>
              
              <Button 
                className="w-full" 
                variant="outline" 
                disabled={!settings?.connected}
                onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Spreadsheet
              </Button>
            </CardContent>
          </Card>
          
          <Alert className="mt-6">
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                This integration creates the following sheets:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Bills - All your logistic bills</li>
                <li>Costs - All cost records</li>
                <li>Revenue - All revenue records</li>
                <li>Customers - Your customer list</li>
                <li>Services - Your service offerings</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
