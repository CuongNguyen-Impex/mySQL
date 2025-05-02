import { Link } from "wouter";
import { ArrowRight, Boxes, FileSpreadsheet, Users, ListTodo } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Settings() {
  const settingsOptions = [
    {
      title: "Categories",
      description: "Manage customers, services, cost types, and suppliers",
      icon: <Boxes className="h-6 w-6" />,
      href: "/settings/categories",
    },
    {
      title: "Cost Type Attributes",
      description: "Manage attributes for each cost type",
      icon: <ListTodo className="h-6 w-6" />,
      href: "/settings/cost-type-attributes",
    },
    {
      title: "Google Sheets Integration",
      description: "Connect and sync your data with Google Sheets",
      icon: <FileSpreadsheet className="h-6 w-6" />,
      href: "/settings/google-sheets",
    },
    {
      title: "User Management",
      description: "Manage users and their permissions",
      icon: <Users className="h-6 w-6" />,
      href: "/settings/users",
    },
  ];

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your application settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsOptions.map((option) => (
          <Card key={option.title}>
            <CardHeader>
              <div className="p-2 w-fit rounded-md bg-primary/10 text-primary mb-4">
                {option.icon}
              </div>
              <CardTitle>{option.title}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href={option.href}>
                <Button variant="outline" className="w-full">
                  Configure
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              These actions are destructive and cannot be undone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border border-destructive/20 rounded-md bg-destructive/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium mb-1">Reset Demo Data</h3>
                  <p className="text-sm text-muted-foreground">
                    This will reset all data to the initial demo state.
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Reset Data
                </Button>
              </div>
            </div>
            
            <div className="p-4 border border-destructive/20 rounded-md bg-destructive/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium mb-1">Clear All Data</h3>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete all bills, costs, and revenue records.
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Clear All Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
