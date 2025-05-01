import { Request, Response } from "express";
import { db } from "@db";
import { bills, costs, revenues, customers, services, suppliers, costTypes } from "@shared/schema";
import { eq, and, desc, between, sql, count, sum, avg } from "drizzle-orm";
import { subDays, subMonths, subYears, parseISO, isValid, startOfDay, endOfDay } from "date-fns";

// Get date range based on timeframe string
const getDateRange = (timeframe?: string, from?: string, to?: string) => {
  // If custom timeframe with valid dates, use them
  if (timeframe === 'custom' && from && to) {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);
    
    if (isValid(fromDate) && isValid(toDate)) {
      return {
        from: startOfDay(fromDate),
        to: endOfDay(toDate)
      };
    }
  }
  
  // Otherwise use predefined timeframes
  const now = new Date();
  let fromDate: Date;
  
  switch (timeframe) {
    case 'week':
      fromDate = subDays(now, 7);
      break;
    case 'month':
      fromDate = subDays(now, 30);
      break;
    case 'quarter':
      fromDate = subDays(now, 90);
      break;
    case 'year':
      fromDate = subYears(now, 1);
      break;
    default:
      // Default to last 30 days
      fromDate = subDays(now, 30);
  }
  
  return {
    from: startOfDay(fromDate),
    to: endOfDay(now)
  };
};

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // Count total bills
    const billsResult = await db.select({
      count: count()
    }).from(bills);
    
    const totalBills = billsResult[0]?.count || 0;
    
    // Calculate total revenue
    const revenueResult = await db.select({
      total: sql<number>`COALESCE(SUM(${revenues.amount}::numeric), 0)`
    }).from(revenues);
    
    const totalRevenue = revenueResult[0]?.total || 0;
    
    // Calculate total costs
    const costsResult = await db.select({
      total: sql<number>`COALESCE(SUM(${costs.amount}::numeric), 0)`
    }).from(costs);
    
    const totalCosts = costsResult[0]?.total || 0;
    
    // Calculate profit
    const totalProfit = totalRevenue - totalCosts;
    
    // Calculate trends (placeholder - in a real app you'd compare with previous periods)
    const billsTrend = 12; // example: 12% increase
    const revenueTrend = 8;
    const costsTrend = 3;
    const profitTrend = 15;
    
    // Get customer performance
    const customerPerformance = await db.query.customers.findMany({
      columns: {
        id: true,
        name: true
      },
      with: {
        bills: {
          with: {
            costs: true,
            revenues: true
          }
        }
      }
    });
    
    const customerPerformanceData = customerPerformance.map(customer => {
      let totalCustomerRevenue = 0;
      let totalCustomerCosts = 0;
      
      customer.bills.forEach(bill => {
        // Sum revenues
        bill.revenues.forEach(revenue => {
          totalCustomerRevenue += parseFloat(revenue.amount.toString());
        });
        
        // Sum costs
        bill.costs.forEach(cost => {
          totalCustomerCosts += parseFloat(cost.amount.toString());
        });
      });
      
      const profit = totalCustomerRevenue - totalCustomerCosts;
      
      return {
        id: customer.id,
        name: customer.name,
        revenue: totalCustomerRevenue,
        costs: totalCustomerCosts,
        profit,
        percentage: totalProfit !== 0 ? (profit / totalProfit) * 100 : 0
      };
    }).sort((a, b) => b.profit - a.profit).slice(0, 5);
    
    // Get service performance
    const servicePerformance = await db.query.services.findMany({
      columns: {
        id: true,
        name: true
      },
      with: {
        bills: {
          with: {
            costs: true
          }
        },
        revenues: true
      }
    });
    
    const servicePerformanceData = servicePerformance.map(service => {
      let totalServiceRevenue = 0;
      let totalServiceCosts = 0;
      
      // Sum revenues
      service.revenues.forEach(revenue => {
        totalServiceRevenue += parseFloat(revenue.amount.toString());
      });
      
      // Sum costs from all bills with this service
      service.bills.forEach(bill => {
        bill.costs.forEach(cost => {
          totalServiceCosts += parseFloat(cost.amount.toString());
        });
      });
      
      const profit = totalServiceRevenue - totalServiceCosts;
      
      return {
        id: service.id,
        name: service.name,
        revenue: totalServiceRevenue,
        costs: totalServiceCosts,
        profit,
        percentage: totalProfit !== 0 ? (profit / totalProfit) * 100 : 0
      };
    }).sort((a, b) => b.profit - a.profit).slice(0, 5);
    
    return res.status(200).json({
      totalBills,
      totalRevenue,
      totalCosts,
      totalProfit,
      billsTrend,
      revenueTrend,
      costsTrend,
      profitTrend,
      customerPerformance: customerPerformanceData,
      servicePerformance: servicePerformanceData
    });
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    return res.status(500).json({
      message: "Server error getting dashboard data"
    });
  }
};

export const getReportByCustomer = async (req: Request, res: Response) => {
  try {
    const { timeframe, from, to } = req.query;
    const dateRange = getDateRange(timeframe as string, from as string, to as string);
    
    // Get all customers with their bills
    const customersWithBills = await db.query.customers.findMany({
      columns: {
        id: true,
        name: true
      },
      with: {
        bills: {
          where: between(bills.date, dateRange.from, dateRange.to),
          with: {
            costs: true,
            revenues: true
          }
        }
      }
    });
    
    // Calculate metrics for each customer
    const customerReports = customersWithBills.map(customer => {
      let totalRevenue = 0;
      let totalCosts = 0;
      
      customer.bills.forEach(bill => {
        // Sum costs
        bill.costs.forEach(cost => {
          totalCosts += parseFloat(cost.amount.toString());
        });
        
        // Sum revenues
        bill.revenues.forEach(revenue => {
          totalRevenue += parseFloat(revenue.amount.toString());
        });
      });
      
      const profit = totalRevenue - totalCosts;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      
      return {
        id: customer.id,
        name: customer.name,
        billCount: customer.bills.length,
        revenue: totalRevenue,
        costs: totalCosts,
        profit,
        margin
      };
    }).sort((a, b) => b.profit - a.profit);
    
    return res.status(200).json({
      customers: customerReports,
      timeframe,
      dateRange
    });
  } catch (error) {
    console.error("Error getting customer report:", error);
    return res.status(500).json({
      message: "Server error getting customer report"
    });
  }
};

export const getReportBySupplier = async (req: Request, res: Response) => {
  try {
    const { timeframe, from, to, costTypeId } = req.query;
    const dateRange = getDateRange(timeframe as string, from as string, to as string);
    
    // Get all suppliers with their costs
    let suppliersQuery = db.query.suppliers.findMany({
      columns: {
        id: true,
        name: true
      },
      with: {
        costs: {
          where: between(costs.date, dateRange.from, dateRange.to),
          with: {
            costType: true
          }
        }
      }
    });
    
    const suppliers = await suppliersQuery;
    
    // Calculate total costs for percentage calculation
    let totalCosts = 0;
    suppliers.forEach(supplier => {
      supplier.costs.forEach(cost => {
        // Apply cost type filter if provided
        if (!costTypeId || cost.costTypeId === Number(costTypeId)) {
          totalCosts += parseFloat(cost.amount.toString());
        }
      });
    });
    
    // Calculate metrics for each supplier
    const supplierReports = suppliers.map(supplier => {
      // Filter costs by cost type if provided
      const filteredCosts = costTypeId 
        ? supplier.costs.filter(cost => cost.costTypeId === Number(costTypeId))
        : supplier.costs;
      
      const totalAmount = filteredCosts.reduce((sum, cost) => sum + parseFloat(cost.amount.toString()), 0);
      const averageCost = filteredCosts.length > 0 ? totalAmount / filteredCosts.length : 0;
      
      // Get unique cost types
      const costTypeMap = new Map();
      filteredCosts.forEach(cost => {
        costTypeMap.set(cost.costTypeId, cost.costType?.name || 'Unknown');
      });
      
      const costTypeNames = Array.from(costTypeMap.values());
      
      return {
        id: supplier.id,
        name: supplier.name,
        transactionCount: filteredCosts.length,
        totalAmount,
        averageCost,
        percentage: totalCosts > 0 ? (totalAmount / totalCosts) * 100 : 0,
        costTypeNames
      };
    })
    .filter(supplier => supplier.transactionCount > 0) // Only include suppliers with costs
    .sort((a, b) => b.totalAmount - a.totalAmount);
    
    return res.status(200).json({
      suppliers: supplierReports,
      timeframe,
      dateRange
    });
  } catch (error) {
    console.error("Error getting supplier report:", error);
    return res.status(500).json({
      message: "Server error getting supplier report"
    });
  }
};

export const getProfitLossReport = async (req: Request, res: Response) => {
  try {
    const { timeframe, from, to } = req.query;
    const dateRange = getDateRange(timeframe as string, from as string, to as string);
    
    // Get all bills in the date range
    const billsInRange = await db.query.bills.findMany({
      where: between(bills.date, dateRange.from, dateRange.to),
      with: {
        costs: true,
        revenues: true
      },
      orderBy: bills.date
    });
    
    // Calculate summary
    let totalRevenue = 0;
    let totalCosts = 0;
    
    billsInRange.forEach(bill => {
      bill.costs.forEach(cost => {
        totalCosts += parseFloat(cost.amount.toString());
      });
      
      bill.revenues.forEach(revenue => {
        totalRevenue += parseFloat(revenue.amount.toString());
      });
    });
    
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Generate period breakdown
    // The structure will depend on the timeframe
    // For this example, we'll use a simple approach that works for all timeframes
    const billsByMonth: Record<string, any> = {};
    
    billsInRange.forEach(bill => {
      const date = new Date(bill.date);
      const period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!billsByMonth[period]) {
        billsByMonth[period] = {
          bills: [],
          revenues: [],
          costs: []
        };
      }
      
      billsByMonth[period].bills.push(bill);
      billsByMonth[period].costs.push(...bill.costs);
      billsByMonth[period].revenues.push(...bill.revenues);
    });
    
    const periods = Object.keys(billsByMonth).map(period => {
      const periodData = billsByMonth[period];
      const periodRevenue = periodData.revenues.reduce((sum: number, revenue: any) => sum + parseFloat(revenue.amount.toString()), 0);
      const periodCosts = periodData.costs.reduce((sum: number, cost: any) => sum + parseFloat(cost.amount.toString()), 0);
      const periodProfit = periodRevenue - periodCosts;
      const periodMargin = periodRevenue > 0 ? (periodProfit / periodRevenue) * 100 : 0;
      
      const [year, month] = period.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'long' });
      
      return {
        label: `${monthName} ${year}`,
        billCount: periodData.bills.length,
        revenue: periodRevenue,
        costs: periodCosts,
        profit: periodProfit,
        margin: periodMargin
      };
    }).sort((a, b) => {
      const [aYear, aMonth] = a.label.split(' ');
      const [bYear, bMonth] = b.label.split(' ');
      
      const aDate = new Date(`${aMonth} 1, ${aYear}`);
      const bDate = new Date(`${bMonth} 1, ${bYear}`);
      
      return aDate.getTime() - bDate.getTime();
    });
    
    return res.status(200).json({
      summary: {
        totalRevenue,
        totalCosts,
        netProfit,
        profitMargin,
        billCount: billsInRange.length
      },
      periods,
      timeframe,
      dateRange
    });
  } catch (error) {
    console.error("Error getting profit loss report:", error);
    return res.status(500).json({
      message: "Server error getting profit loss report"
    });
  }
};

export const exportReportByCustomer = async (req: Request, res: Response) => {
  try {
    const { timeframe, from, to } = req.query;
    
    // Reuse the getReportByCustomer logic
    const dateRange = getDateRange(timeframe as string, from as string, to as string);
    
    const customersWithBills = await db.query.customers.findMany({
      columns: {
        id: true,
        name: true
      },
      with: {
        bills: {
          where: between(bills.date, dateRange.from, dateRange.to),
          with: {
            costs: true,
            revenues: true
          }
        }
      }
    });
    
    const customerReports = customersWithBills.map(customer => {
      let totalRevenue = 0;
      let totalCosts = 0;
      
      customer.bills.forEach(bill => {
        bill.costs.forEach(cost => {
          totalCosts += parseFloat(cost.amount.toString());
        });
        
        bill.revenues.forEach(revenue => {
          totalRevenue += parseFloat(revenue.amount.toString());
        });
      });
      
      const profit = totalRevenue - totalCosts;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      
      return {
        id: customer.id,
        name: customer.name,
        billCount: customer.bills.length,
        revenue: totalRevenue.toFixed(2),
        costs: totalCosts.toFixed(2),
        profit: profit.toFixed(2),
        margin: margin.toFixed(2)
      };
    });
    
    // Generate CSV content
    const headers = ['Customer ID', 'Customer Name', 'Number of Bills', 'Revenue ($)', 'Costs ($)', 'Profit ($)', 'Margin (%)'];
    const rows = customerReports.map(report => [
      report.id,
      report.name,
      report.billCount,
      report.revenue,
      report.costs,
      report.profit,
      report.margin
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customer-report.csv');
    
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting customer report:", error);
    return res.status(500).json({
      message: "Server error exporting customer report"
    });
  }
};

export const exportReportBySupplier = async (req: Request, res: Response) => {
  try {
    const { timeframe, from, to, costTypeId } = req.query;
    
    // Reuse the getReportBySupplier logic
    const dateRange = getDateRange(timeframe as string, from as string, to as string);
    
    let suppliersQuery = db.query.suppliers.findMany({
      columns: {
        id: true,
        name: true
      },
      with: {
        costs: {
          where: between(costs.date, dateRange.from, dateRange.to),
          with: {
            costType: true
          }
        }
      }
    });
    
    const suppliers = await suppliersQuery;
    
    let totalCosts = 0;
    suppliers.forEach(supplier => {
      supplier.costs.forEach(cost => {
        if (!costTypeId || cost.costTypeId === Number(costTypeId)) {
          totalCosts += parseFloat(cost.amount.toString());
        }
      });
    });
    
    const supplierReports = suppliers.map(supplier => {
      const filteredCosts = costTypeId 
        ? supplier.costs.filter(cost => cost.costTypeId === Number(costTypeId))
        : supplier.costs;
      
      const totalAmount = filteredCosts.reduce((sum, cost) => sum + parseFloat(cost.amount.toString()), 0);
      const averageCost = filteredCosts.length > 0 ? totalAmount / filteredCosts.length : 0;
      
      const costTypeMap = new Map();
      filteredCosts.forEach(cost => {
        costTypeMap.set(cost.costTypeId, cost.costType?.name || 'Unknown');
      });
      
      const costTypeNames = Array.from(costTypeMap.values()).join(', ');
      
      return {
        id: supplier.id,
        name: supplier.name,
        costTypes: costTypeNames,
        transactionCount: filteredCosts.length,
        totalAmount: totalAmount.toFixed(2),
        averageCost: averageCost.toFixed(2),
        percentage: (totalCosts > 0 ? (totalAmount / totalCosts) * 100 : 0).toFixed(2)
      };
    })
    .filter(supplier => supplier.transactionCount > 0);
    
    // Generate CSV content
    const headers = ['Supplier ID', 'Supplier Name', 'Cost Types', 'Number of Transactions', 'Total Amount ($)', 'Average Cost ($)', 'Percentage (%)'];
    const rows = supplierReports.map(report => [
      report.id,
      report.name,
      report.costTypes,
      report.transactionCount,
      report.totalAmount,
      report.averageCost,
      report.percentage
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=supplier-report.csv');
    
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting supplier report:", error);
    return res.status(500).json({
      message: "Server error exporting supplier report"
    });
  }
};

export const exportProfitLossReport = async (req: Request, res: Response) => {
  try {
    const { timeframe, from, to } = req.query;
    
    // Reuse the getProfitLossReport logic
    const dateRange = getDateRange(timeframe as string, from as string, to as string);
    
    const billsInRange = await db.query.bills.findMany({
      where: between(bills.date, dateRange.from, dateRange.to),
      with: {
        costs: true,
        revenues: true
      },
      orderBy: bills.date
    });
    
    let totalRevenue = 0;
    let totalCosts = 0;
    
    billsInRange.forEach(bill => {
      bill.costs.forEach(cost => {
        totalCosts += parseFloat(cost.amount.toString());
      });
      
      bill.revenues.forEach(revenue => {
        totalRevenue += parseFloat(revenue.amount.toString());
      });
    });
    
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    const billsByMonth: Record<string, any> = {};
    
    billsInRange.forEach(bill => {
      const date = new Date(bill.date);
      const period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!billsByMonth[period]) {
        billsByMonth[period] = {
          bills: [],
          revenues: [],
          costs: []
        };
      }
      
      billsByMonth[period].bills.push(bill);
      billsByMonth[period].costs.push(...bill.costs);
      billsByMonth[period].revenues.push(...bill.revenues);
    });
    
    const periods = Object.keys(billsByMonth).map(period => {
      const periodData = billsByMonth[period];
      const periodRevenue = periodData.revenues.reduce((sum: number, revenue: any) => sum + parseFloat(revenue.amount.toString()), 0);
      const periodCosts = periodData.costs.reduce((sum: number, cost: any) => sum + parseFloat(cost.amount.toString()), 0);
      const periodProfit = periodRevenue - periodCosts;
      const periodMargin = periodRevenue > 0 ? (periodProfit / periodRevenue) * 100 : 0;
      
      const [year, month] = period.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'long' });
      
      return {
        label: `${monthName} ${year}`,
        billCount: periodData.bills.length,
        revenue: periodRevenue.toFixed(2),
        costs: periodCosts.toFixed(2),
        profit: periodProfit.toFixed(2),
        margin: periodMargin.toFixed(2)
      };
    }).sort((a, b) => {
      const [aYear, aMonth] = a.label.split(' ');
      const [bYear, bMonth] = b.label.split(' ');
      
      const aDate = new Date(`${aMonth} 1, ${aYear}`);
      const bDate = new Date(`${bMonth} 1, ${bYear}`);
      
      return aDate.getTime() - bDate.getTime();
    });
    
    // Generate CSV content
    const headers = ['Period', 'Number of Bills', 'Revenue ($)', 'Costs ($)', 'Profit ($)', 'Margin (%)'];
    const rows = periods.map(period => [
      period.label,
      period.billCount,
      period.revenue,
      period.costs,
      period.profit,
      period.margin
    ]);
    
    // Add summary row
    rows.push([
      'TOTAL',
      billsInRange.length.toString(),
      totalRevenue.toFixed(2),
      totalCosts.toFixed(2),
      netProfit.toFixed(2),
      profitMargin.toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=profit-loss-report.csv');
    
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting profit loss report:", error);
    return res.status(500).json({
      message: "Server error exporting profit loss report"
    });
  }
};

export const getBillDetailReport = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    
    // Parse and validate dates
    let dateFrom, dateTo;
    
    if (fromDate && toDate) {
      dateFrom = parseISO(fromDate as string);
      dateTo = parseISO(toDate as string);
      
      if (!isValid(dateFrom) || !isValid(dateTo)) {
        return res.status(400).json({
          message: "Invalid date format"
        });
      }
    } else {
      // Default to last 30 days if no dates provided
      dateTo = new Date();
      dateFrom = subDays(dateTo, 30);
    }
    
    // Get all bills with costs, revenues, customer, and service relationships
    const billsWithDetails = await db.query.bills.findMany({
      where: between(bills.date, startOfDay(dateFrom), endOfDay(dateTo)),
      with: {
        customer: true,
        service: true,
        costs: {
          with: {
            supplier: true,
            costType: true
          }
        },
        revenues: true
      },
      orderBy: desc(bills.date)
    });
    
    return res.status(200).json({
      bills: billsWithDetails,
      dateRange: {
        from: dateFrom,
        to: dateTo
      }
    });
  } catch (error) {
    console.error("Error getting bill detail report:", error);
    return res.status(500).json({
      message: "Server error getting bill detail report"
    });
  }
};

export const exportBillDetailReport = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;
    
    // Parse and validate dates
    let dateFrom, dateTo;
    
    if (fromDate && toDate) {
      dateFrom = parseISO(fromDate as string);
      dateTo = parseISO(toDate as string);
      
      if (!isValid(dateFrom) || !isValid(dateTo)) {
        return res.status(400).json({
          message: "Invalid date format"
        });
      }
    } else {
      // Default to last 30 days if no dates provided
      dateTo = new Date();
      dateFrom = subDays(dateTo, 30);
    }
    
    // Get all bills with costs, revenues, customer, and service relationships
    const billsWithDetails = await db.query.bills.findMany({
      where: between(bills.date, startOfDay(dateFrom), endOfDay(dateTo)),
      with: {
        customer: true,
        service: true,
        costs: {
          with: {
            supplier: true,
            costType: true
          }
        },
        revenues: true
      },
      orderBy: desc(bills.date)
    });
    
    // Create CSV Writer
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const path = require('path');
    const filePath = path.join(__dirname, '..', 'temp', `bill_detail_report_${new Date().getTime()}.csv`);
    
    // Prepare data for CSV format (flatten nested data)
    const csvRows: any[] = [];
    
    billsWithDetails.forEach(bill => {
      // For bills with no costs or revenues, add a single row
      if (bill.costs.length === 0 && bill.revenues.length === 0) {
        csvRows.push({
          billNo: bill.billNo,
          date: bill.date,
          customerName: bill.customer?.name || 'N/A',
          serviceName: bill.service?.name || 'N/A',
          supplierName: 'N/A',
          costType: 'N/A',
          costAmount: 0,
          revenueAmount: 0,
          profit: 0
        });
        return;
      }
      
      // Calculate total revenue for this bill
      const totalRevenue = bill.revenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount.toString()), 0);
      
      // For bills with costs, add one row per cost
      if (bill.costs.length > 0) {
        bill.costs.forEach(cost => {
          // Calculate profit share for this cost
          const costAmount = parseFloat(cost.amount.toString());
          const profitShare = (totalRevenue / bill.costs.length) - costAmount;
          
          csvRows.push({
            billNo: bill.billNo,
            date: bill.date,
            customerName: bill.customer?.name || 'N/A',
            serviceName: bill.service?.name || 'N/A',
            supplierName: cost.supplier?.name || 'N/A',
            costType: cost.costType?.name || 'N/A',
            costAmount: costAmount,
            revenueAmount: totalRevenue / bill.costs.length, // Divide revenue equally among costs
            profit: profitShare
          });
        });
      }
      // For bills with revenues but no costs
      else if (bill.revenues.length > 0) {
        csvRows.push({
          billNo: bill.billNo,
          date: bill.date,
          customerName: bill.customer?.name || 'N/A',
          serviceName: bill.service?.name || 'N/A',
          supplierName: 'N/A',
          costType: 'N/A',
          costAmount: 0,
          revenueAmount: totalRevenue,
          profit: totalRevenue
        });
      }
    });
    
    // Create and write CSV file
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'billNo', title: 'Hóa đơn' },
        { id: 'date', title: 'Ngày' },
        { id: 'customerName', title: 'Khách hàng' },
        { id: 'serviceName', title: 'Dịch vụ' },
        { id: 'supplierName', title: 'Nhà cung cấp' },
        { id: 'costType', title: 'Loại chi phí' },
        { id: 'costAmount', title: 'Chi phí' },
        { id: 'revenueAmount', title: 'Doanh thu' },
        { id: 'profit', title: 'Lãi/Lỗ' },
      ]
    });
    
    await csvWriter.writeRecords(csvRows);
    
    // Send the file
    return res.download(filePath, `bao_cao_chi_tiet_hoa_don_${dateFrom.toISOString().split('T')[0]}_${dateTo.toISOString().split('T')[0]}.csv`, (err) => {
      if (err) {
        console.error("Error sending report file:", err);
      }
      
      // Clean up the temp file
      const fs = require('fs');
      fs.unlink(filePath, (err: any) => {
        if (err) console.error("Error deleting temp file:", err);
      });
    });
  } catch (error) {
    console.error("Error exporting bill detail report:", error);
    return res.status(500).json({
      message: "Server error exporting bill detail report"
    });
  }
};
