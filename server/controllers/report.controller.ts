import { Request, Response } from "express";
import { db } from "@db";
import { bills, costs, revenues, customers, services, suppliers, costTypes, costAttributeValues, costTypeAttributes } from "@shared/schema";
import { eq, and, desc, between, sql, count, sum, avg } from "drizzle-orm";
import { subDays, subMonths, subYears, parseISO, isValid, startOfDay, endOfDay } from "date-fns";

// Helper function to classify costs by their attributes
const createCostAttributeMap = async () => {
  // Get all costs with their attribute values
  const costsWithAttributes = await db.query.costs.findMany({
    with: {
      attributeValues: {
        with: {
          attribute: true
        }
      }
    }
  });
  
  // Create a map of cost attribute types for quick lookup
  const costAttributeMap = new Map<number, string>();
  
  // Default is to consider as 'Hóa đơn' if not specified
  costsWithAttributes.forEach(cost => {
    // Default to 'Hóa đơn' if no attribute values
    costAttributeMap.set(cost.id, "Hóa đơn");
    
    // If has attribute values, determine type
    if (cost.attributeValues && cost.attributeValues.length > 0) {
      // Find attribute with name 'Trả hộ'
      const traHoAttribute = cost.attributeValues.find(av => 
        av.attribute && av.attribute.name === "Trả hộ" && av.value === "true");
      
      // Find attribute with name 'Ko hóa đơn'
      const koHoaDonAttribute = cost.attributeValues.find(av => 
        av.attribute && av.attribute.name === "Ko hóa đơn" && av.value === "true");
      
      if (traHoAttribute) {
        costAttributeMap.set(cost.id, "Trả hộ");
      } else if (koHoaDonAttribute) {
        costAttributeMap.set(cost.id, "Ko hóa đơn");
      }
    }
  });
  
  return costAttributeMap;
};

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
      fromDate = subDays(now, 90); // Increased from 30 to 90 days
      break;
    case 'quarter':
      fromDate = subDays(now, 180); // Increased from 90 to 180 days
      break;
    case 'year':
      fromDate = subYears(now, 1);
      break;
    default:
      // Default to last 90 days
      fromDate = subDays(now, 90);
  }
  
  return {
    from: startOfDay(fromDate),
    to: endOfDay(now)
  };
};

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // Use the helper function to get cost attribute map
    const costAttributeMap = await createCostAttributeMap();
    
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
    
    // Get all costs to categorize
    const allCosts = await db.query.costs.findMany({
      columns: {
        id: true,
        amount: true
      }
    });
    
    // Separate costs by attribute type
    let totalHoaDonCosts = 0;
    let totalTraHoCosts = 0;
    let totalKoHoaDonCosts = 0;
    
    allCosts.forEach(cost => {
      const costType = costAttributeMap.get(cost.id) || "Hóa đơn";
      const amount = parseFloat(cost.amount.toString());
      
      if (costType === "Trả hộ") {
        totalTraHoCosts += amount;
      } else if (costType === "Ko hóa đơn") {
        totalKoHoaDonCosts += amount;
      } else {
        totalHoaDonCosts += amount;
      }
    });
    
    // Calculate total costs (all types combined)
    const totalCosts = totalHoaDonCosts + totalTraHoCosts + totalKoHoaDonCosts;
    
    // Calculate profit - only based on 'Hóa đơn' costs as per business rules
    const totalProfit = totalRevenue - totalHoaDonCosts;
    
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
      let totalCustomerHoaDonCosts = 0;
      let totalCustomerTraHoCosts = 0;
      
      customer.bills.forEach(bill => {
        // Sum revenues
        bill.revenues.forEach(revenue => {
          totalCustomerRevenue += parseFloat(revenue.amount.toString());
        });
        
        // Sum costs based on attribute type
        bill.costs.forEach(cost => {
          const costType = costAttributeMap.get(cost.id) || "Hóa đơn";
          const amount = parseFloat(cost.amount.toString());
          
          if (costType === "Trả hộ") {
            totalCustomerTraHoCosts += amount;
          } else {
            totalCustomerHoaDonCosts += amount;
          }
        });
      });
      
      // Calculate total costs
      const totalCustomerCosts = totalCustomerHoaDonCosts + totalCustomerTraHoCosts;
      
      // Calculate profit based only on 'Hóa đơn' costs
      const profit = totalCustomerRevenue - totalCustomerHoaDonCosts;
      
      return {
        id: customer.id,
        name: customer.name,
        revenue: totalCustomerRevenue,
        hoaDonCosts: totalCustomerHoaDonCosts,
        traHoCosts: totalCustomerTraHoCosts,
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
      let totalServiceHoaDonCosts = 0;
      let totalServiceTraHoCosts = 0;
      
      // Sum revenues
      service.revenues.forEach(revenue => {
        totalServiceRevenue += parseFloat(revenue.amount.toString());
      });
      
      // Sum costs from all bills with this service based on attribute type
      service.bills.forEach(bill => {
        bill.costs.forEach(cost => {
          const costType = costAttributeMap.get(cost.id) || "Hóa đơn";
          const amount = parseFloat(cost.amount.toString());
          
          if (costType === "Trả hộ") {
            totalServiceTraHoCosts += amount;
          } else {
            totalServiceHoaDonCosts += amount;
          }
        });
      });
      
      // Calculate total costs
      const totalServiceCosts = totalServiceHoaDonCosts + totalServiceTraHoCosts;
      
      // Calculate profit based only on 'Hóa đơn' costs
      const profit = totalServiceRevenue - totalServiceHoaDonCosts;
      
      return {
        id: service.id,
        name: service.name,
        revenue: totalServiceRevenue,
        hoaDonCosts: totalServiceHoaDonCosts,
        traHoCosts: totalServiceTraHoCosts,
        costs: totalServiceCosts,
        profit,
        percentage: totalProfit !== 0 ? (profit / totalProfit) * 100 : 0
      };
    }).sort((a, b) => b.profit - a.profit).slice(0, 5);
    
    return res.status(200).json({
      totalBills,
      totalRevenue,
      hoaDonCosts: totalHoaDonCosts,
      traHoCosts: totalTraHoCosts,
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
    
    // Use the helper function to get cost attribute map
    const costAttributeMap = await createCostAttributeMap();
    
    // Get all customers with their bills
    const customersWithBills = await db.query.customers.findMany({
      columns: {
        id: true,
        name: true
      },
      with: {
        bills: {
          where: between(bills.date, dateRange.from.toISOString(), dateRange.to.toISOString()),
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
      let totalHoaDonCosts = 0;
      let totalTraHoCosts = 0;
      
      customer.bills.forEach(bill => {
        // Sum costs based on their attribute type
        bill.costs.forEach(cost => {
          // Check if cost is 'Trả hộ' or 'Hóa đơn' from our map
          const costType = costAttributeMap.get(cost.id) || "Hóa đơn"; // Default to 'Hóa đơn' if not found
          
          if (costType === "Trả hộ") {
            totalTraHoCosts += parseFloat(cost.amount.toString());
          } else { // "Hóa đơn"
            totalHoaDonCosts += parseFloat(cost.amount.toString());
          }
        });
        
        // Sum revenues
        bill.revenues.forEach(revenue => {
          totalRevenue += parseFloat(revenue.amount.toString());
        });
      });
      
      // Calculate total costs
      const totalCosts = totalHoaDonCosts + totalTraHoCosts;
      
      // Only use 'Hóa đơn' costs for profit calculation
      const profit = totalRevenue - totalHoaDonCosts;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      
      return {
        id: customer.id,
        name: customer.name,
        billCount: customer.bills.length,
        revenue: totalRevenue,
        hoaDonCosts: totalHoaDonCosts,
        traHoCosts: totalTraHoCosts,
        totalCosts,
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
    
    // First, get all the costs with their attribute values to determine which are 'Hóa đơn' vs 'Trả hộ'
    const costsWithAttributes = await db.query.costs.findMany({
      with: {
        attributeValues: {
          with: {
            attribute: true
          }
        }
      }
    });
    
    // Create a map of cost attribute types for quick lookup
    const costAttributeMap = new Map<number, string>();
    
    // Default is to consider as 'Hóa đơn' if not specified
    costsWithAttributes.forEach(cost => {
      // Default to 'Hóa đơn' if no attribute values
      costAttributeMap.set(cost.id, "Hóa đơn");
      
      // If has attribute values, determine type
      if (cost.attributeValues && cost.attributeValues.length > 0) {
        // Find attribute with name 'Trả hộ'
        const traHoAttribute = cost.attributeValues.find(av => 
          av.attribute && av.attribute.name === "Trả hộ" && av.value === "true");
        
        if (traHoAttribute) {
          costAttributeMap.set(cost.id, "Trả hộ");
        }
      }
    });
    
    // Get all suppliers with their costs
    let suppliersQuery = db.query.suppliers.findMany({
      columns: {
        id: true,
        name: true
      },
      with: {
        costs: {
          where: between(costs.date, dateRange.from.toISOString(), dateRange.to.toISOString()),
          with: {
            costType: true
          }
        }
      }
    });
    
    const suppliers = await suppliersQuery;
    
    // Calculate totals by attribute type
    let totalHoaDonCosts = 0;
    let totalTraHoCosts = 0;
    
    suppliers.forEach(supplier => {
      supplier.costs.forEach(cost => {
        // Apply cost type filter if provided
        if (!costTypeId || cost.costTypeId === Number(costTypeId)) {
          // Determine if cost is 'Trả hộ' or 'Hóa đơn'
          const costType = costAttributeMap.get(cost.id) || "Hóa đơn";
          
          if (costType === "Trả hộ") {
            totalTraHoCosts += parseFloat(cost.amount.toString());
          } else {
            totalHoaDonCosts += parseFloat(cost.amount.toString());
          }
        }
      });
    });
    
    // Total cost is sum of both types
    const totalCosts = totalHoaDonCosts + totalTraHoCosts;
    
    // Calculate metrics for each supplier
    const supplierReports = suppliers.map(supplier => {
      // Filter costs by cost type if provided
      const filteredCosts = costTypeId 
        ? supplier.costs.filter(cost => cost.costTypeId === Number(costTypeId))
        : supplier.costs;
      
      // Split costs by attribute type
      let totalHoaDonAmount = 0;
      let totalTraHoAmount = 0;
      
      filteredCosts.forEach(cost => {
        const costType = costAttributeMap.get(cost.id) || "Hóa đơn";
        
        if (costType === "Trả hộ") {
          totalTraHoAmount += parseFloat(cost.amount.toString());
        } else {
          totalHoaDonAmount += parseFloat(cost.amount.toString());
        }
      });
      
      const totalAmount = totalHoaDonAmount + totalTraHoAmount;
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
        hoaDonAmount: totalHoaDonAmount,
        traHoAmount: totalTraHoAmount,
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
      totalHoaDonCosts,
      totalTraHoCosts,
      totalCosts,
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
    
    // First, get all the costs with their attribute values to determine which are 'Hóa đơn' vs 'Trả hộ'
    const costsWithAttributes = await db.query.costs.findMany({
      with: {
        attributeValues: {
          with: {
            attribute: true
          }
        }
      }
    });
    
    // Create a map of cost attribute types for quick lookup
    const costAttributeMap = new Map<number, string>();
    
    // Default is to consider as 'Hóa đơn' if not specified
    costsWithAttributes.forEach(cost => {
      // Default to 'Hóa đơn' if no attribute values
      costAttributeMap.set(cost.id, "Hóa đơn");
      
      // If has attribute values, determine type
      if (cost.attributeValues && cost.attributeValues.length > 0) {
        // Find attribute with name 'Trả hộ'
        const traHoAttribute = cost.attributeValues.find(av => 
          av.attribute && av.attribute.name === "Trả hộ" && av.value === "true");
        
        if (traHoAttribute) {
          costAttributeMap.set(cost.id, "Trả hộ");
        }
      }
    });
    
    // Get all bills in the date range
    const billsInRange = await db.query.bills.findMany({
      where: between(bills.date, dateRange.from.toISOString(), dateRange.to.toISOString()),
      with: {
        costs: true,
        revenues: true
      },
      orderBy: bills.date
    });
    
    // Calculate summary with cost attribute type differentiation
    let totalRevenue = 0;
    let totalHoaDonCosts = 0;
    let totalTraHoCosts = 0;
    
    billsInRange.forEach(bill => {
      // Sum costs based on their attribute type
      bill.costs.forEach(cost => {
        // Check if cost is 'Trả hộ' or 'Hóa đơn' from our map
        const costType = costAttributeMap.get(cost.id) || "Hóa đơn"; // Default to 'Hóa đơn' if not found
        
        if (costType === "Trả hộ") {
          totalTraHoCosts += parseFloat(cost.amount.toString());
        } else { // "Hóa đơn"
          totalHoaDonCosts += parseFloat(cost.amount.toString());
        }
      });
      
      // Sum revenues
      bill.revenues.forEach(revenue => {
        totalRevenue += parseFloat(revenue.amount.toString());
      });
    });
    
    // Calculate total costs (both types combined)
    const totalCosts = totalHoaDonCosts + totalTraHoCosts;
    
    // Only use 'Hóa đơn' costs for net profit calculation
    const netProfit = totalRevenue - totalHoaDonCosts;
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
          hoaDonCosts: [],
          traHoCosts: []
        };
      }
      
      billsByMonth[period].bills.push(bill);
      
      // Split costs by attribute type
      bill.costs.forEach(cost => {
        const costType = costAttributeMap.get(cost.id) || "Hóa đơn";
        
        if (costType === "Trả hộ") {
          billsByMonth[period].traHoCosts.push(cost);
        } else {
          billsByMonth[period].hoaDonCosts.push(cost);
        }
      });
      
      billsByMonth[period].revenues.push(...bill.revenues);
    });
    
    const periods = Object.keys(billsByMonth).map(period => {
      const periodData = billsByMonth[period];
      const periodRevenue = periodData.revenues.reduce((sum: number, revenue: any) => sum + parseFloat(revenue.amount.toString()), 0);
      
      // Split costs by type for reporting
      const periodHoaDonCosts = periodData.hoaDonCosts.reduce((sum: number, cost: any) => sum + parseFloat(cost.amount.toString()), 0);
      const periodTraHoCosts = periodData.traHoCosts.reduce((sum: number, cost: any) => sum + parseFloat(cost.amount.toString()), 0);
      const periodTotalCosts = periodHoaDonCosts + periodTraHoCosts;
      
      // Only use 'Hóa đơn' costs for profit calculation
      const periodProfit = periodRevenue - periodHoaDonCosts;
      const periodMargin = periodRevenue > 0 ? (periodProfit / periodRevenue) * 100 : 0;
      
      const [year, month] = period.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'long' });
      
      return {
        label: `${monthName} ${year}`,
        billCount: periodData.bills.length,
        revenue: periodRevenue,
        hoaDonCosts: periodHoaDonCosts,
        traHoCosts: periodTraHoCosts,
        totalCosts: periodTotalCosts,
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
        hoaDonCosts: totalHoaDonCosts,  // "Hóa đơn" costs
        traHoCosts: totalTraHoCosts,    // "Trả hộ" costs
        totalCosts,                    // Combined costs
        netProfit,                     // Revenue - Hóa đơn costs only
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
    
    // First, get all the costs with their attribute values to determine which are 'Hóa đơn' vs 'Trả hộ'
    const costsWithAttributes = await db.query.costs.findMany({
      with: {
        attributeValues: {
          with: {
            attribute: true
          }
        }
      }
    });
    
    // Create a map of cost attribute types for quick lookup
    const costAttributeMap = new Map<number, string>();
    
    // Default is to consider as 'Hóa đơn' if not specified
    costsWithAttributes.forEach(cost => {
      // Default to 'Hóa đơn' if no attribute values
      costAttributeMap.set(cost.id, "Hóa đơn");
      
      // If has attribute values, determine type
      if (cost.attributeValues && cost.attributeValues.length > 0) {
        // Find attribute with name 'Trả hộ'
        const traHoAttribute = cost.attributeValues.find(av => 
          av.attribute && av.attribute.name === "Trả hộ" && av.value === "true");
        
        if (traHoAttribute) {
          costAttributeMap.set(cost.id, "Trả hộ");
        }
      }
    });
    
    const customersWithBills = await db.query.customers.findMany({
      columns: {
        id: true,
        name: true
      },
      with: {
        bills: {
          where: between(bills.date, dateRange.from.toISOString(), dateRange.to.toISOString()),
          with: {
            costs: true,
            revenues: true
          }
        }
      }
    });
    
    const customerReports = customersWithBills.map(customer => {
      let totalRevenue = 0;
      let totalHoaDonCosts = 0;
      let totalTraHoCosts = 0;
      
      customer.bills.forEach(bill => {
        // Sum costs based on their attribute type
        bill.costs.forEach(cost => {
          // Check if cost is 'Trả hộ' or 'Hóa đơn' from our map
          const costType = costAttributeMap.get(cost.id) || "Hóa đơn"; // Default to 'Hóa đơn' if not found
          
          if (costType === "Trả hộ") {
            totalTraHoCosts += parseFloat(cost.amount.toString());
          } else { // "Hóa đơn"
            totalHoaDonCosts += parseFloat(cost.amount.toString());
          }
        });
        
        // Sum revenues
        bill.revenues.forEach(revenue => {
          totalRevenue += parseFloat(revenue.amount.toString());
        });
      });
      
      // Calculate total costs
      const totalCosts = totalHoaDonCosts + totalTraHoCosts;
      
      // Only use 'Hóa đơn' costs for profit calculation
      const profit = totalRevenue - totalHoaDonCosts;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      
      return {
        id: customer.id,
        name: customer.name,
        billCount: customer.bills.length,
        revenue: totalRevenue.toFixed(2),
        hoaDonCosts: totalHoaDonCosts.toFixed(2),
        traHoCosts: totalTraHoCosts.toFixed(2),
        totalCosts: totalCosts.toFixed(2),
        profit: profit.toFixed(2),
        margin: margin.toFixed(2)
      };
    });
    
    // Generate CSV content
    const headers = [
      'ID Khách hàng', 
      'Tên Khách hàng', 
      'Số hóa đơn', 
      'Doanh thu', 
      'Chi phí Hóa đơn', 
      'Chi phí Trả hộ', 
      'Tổng chi phí', 
      'Lợi nhuận', 
      'Tỷ suất lợi nhuận (%)'
    ];
    const rows = customerReports.map(report => [
      report.id,
      report.name,
      report.billCount,
      report.revenue,
      report.hoaDonCosts,
      report.traHoCosts,
      report.totalCosts,
      report.profit,
      report.margin
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bao-cao-khach-hang.csv');
    
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
    
    // First, get all the costs with their attribute values to determine which are 'Hóa đơn' vs 'Trả hộ'
    const costsWithAttributes = await db.query.costs.findMany({
      with: {
        attributeValues: {
          with: {
            attribute: true
          }
        }
      }
    });
    
    // Create a map of cost attribute types for quick lookup
    const costAttributeMap = new Map<number, string>();
    
    // Default is to consider as 'Hóa đơn' if not specified
    costsWithAttributes.forEach(cost => {
      // Default to 'Hóa đơn' if no attribute values
      costAttributeMap.set(cost.id, "Hóa đơn");
      
      // If has attribute values, determine type
      if (cost.attributeValues && cost.attributeValues.length > 0) {
        // Find attribute with name 'Trả hộ'
        const traHoAttribute = cost.attributeValues.find(av => 
          av.attribute && av.attribute.name === "Trả hộ" && av.value === "true");
        
        if (traHoAttribute) {
          costAttributeMap.set(cost.id, "Trả hộ");
        }
      }
    });
    
    let suppliersQuery = db.query.suppliers.findMany({
      columns: {
        id: true,
        name: true
      },
      with: {
        costs: {
          where: between(costs.date, dateRange.from.toISOString(), dateRange.to.toISOString()),
          with: {
            costType: true
          }
        }
      }
    });
    
    const suppliers = await suppliersQuery;
    
    // Split totals by attribute type
    let totalHoaDonCosts = 0;
    let totalTraHoCosts = 0;
    
    suppliers.forEach(supplier => {
      supplier.costs.forEach(cost => {
        if (!costTypeId || cost.costTypeId === Number(costTypeId)) {
          // Determine if cost is 'Trả hộ' or 'Hóa đơn'
          const costType = costAttributeMap.get(cost.id) || "Hóa đơn";
          
          if (costType === "Trả hộ") {
            totalTraHoCosts += parseFloat(cost.amount.toString());
          } else {
            totalHoaDonCosts += parseFloat(cost.amount.toString());
          }
        }
      });
    });
    
    // Total of all costs regardless of attribute
    const totalCosts = totalHoaDonCosts + totalTraHoCosts;
    
    const supplierReports = suppliers.map(supplier => {
      const filteredCosts = costTypeId 
        ? supplier.costs.filter(cost => cost.costTypeId === Number(costTypeId))
        : supplier.costs;
      
      // Split costs by attribute type
      let totalHoaDonAmount = 0;
      let totalTraHoAmount = 0;
      
      filteredCosts.forEach(cost => {
        const costType = costAttributeMap.get(cost.id) || "Hóa đơn";
        
        if (costType === "Trả hộ") {
          totalTraHoAmount += parseFloat(cost.amount.toString());
        } else {
          totalHoaDonAmount += parseFloat(cost.amount.toString());
        }
      });
      
      const totalAmount = totalHoaDonAmount + totalTraHoAmount;
      const averageCost = filteredCosts.length > 0 ? totalAmount / filteredCosts.length : 0;
      
      // Generate cost type names for display
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
        hoaDonAmount: totalHoaDonAmount.toFixed(2),
        traHoAmount: totalTraHoAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        averageCost: averageCost.toFixed(2),
        percentage: (totalCosts > 0 ? (totalAmount / totalCosts) * 100 : 0).toFixed(2)
      };
    })
    .filter(supplier => supplier.transactionCount > 0);
    
    // Generate CSV content with Vietnamese headers
    const headers = [
      'ID NCC', 
      'Tên nhà cung cấp', 
      'Loại chi phí', 
      'Số giao dịch', 
      'Chi phí Hóa đơn', 
      'Chi phí Trả hộ', 
      'Tổng chi phí', 
      'Chi phí trung bình', 
      'Phần trăm (%)'
    ];
    
    const rows = supplierReports.map(report => [
      report.id,
      report.name,
      report.costTypes,
      report.transactionCount,
      report.hoaDonAmount,
      report.traHoAmount,
      report.totalAmount,
      report.averageCost,
      report.percentage
    ]);
    
    // Add summary row
    rows.push([
      '',
      'TỔNG',
      '',
      supplierReports.reduce((sum, supplier) => sum + supplier.transactionCount, 0),
      totalHoaDonCosts.toFixed(2),
      totalTraHoCosts.toFixed(2),
      totalCosts.toFixed(2),
      (totalCosts / supplierReports.reduce((sum, supplier) => sum + supplier.transactionCount, 0) || 0).toFixed(2),
      '100.00'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bao-cao-nha-cung-cap.csv');
    
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
    
    // First, get all the costs with their attribute values to determine which are 'Hóa đơn' vs 'Trả hộ'
    const costsWithAttributes = await db.query.costs.findMany({
      with: {
        attributeValues: {
          with: {
            attribute: true
          }
        }
      }
    });
    
    // Create a map of cost attribute types for quick lookup
    const costAttributeMap = new Map<number, string>();
    
    // Default is to consider as 'Hóa đơn' if not specified
    costsWithAttributes.forEach(cost => {
      // Default to 'Hóa đơn' if no attribute values
      costAttributeMap.set(cost.id, "Hóa đơn");
      
      // If has attribute values, determine type
      if (cost.attributeValues && cost.attributeValues.length > 0) {
        // Find attribute with name 'Trả hộ'
        const traHoAttribute = cost.attributeValues.find(av => 
          av.attribute && av.attribute.name === "Trả hộ" && av.value === "true");
        
        if (traHoAttribute) {
          costAttributeMap.set(cost.id, "Trả hộ");
        }
      }
    });
    
    const billsInRange = await db.query.bills.findMany({
      where: between(bills.date, dateRange.from.toISOString(), dateRange.to.toISOString()),
      with: {
        costs: true,
        revenues: true
      },
      orderBy: bills.date
    });
    
    // Calculate summary with cost attribute type differentiation
    let totalRevenue = 0;
    let totalHoaDonCosts = 0;
    let totalTraHoCosts = 0;
    
    billsInRange.forEach(bill => {
      // Sum costs based on their attribute type
      bill.costs.forEach(cost => {
        // Check if cost is 'Trả hộ' or 'Hóa đơn' from our map
        const costType = costAttributeMap.get(cost.id) || "Hóa đơn"; // Default to 'Hóa đơn' if not found
        
        if (costType === "Trả hộ") {
          totalTraHoCosts += parseFloat(cost.amount.toString());
        } else { // "Hóa đơn"
          totalHoaDonCosts += parseFloat(cost.amount.toString());
        }
      });
      
      // Sum revenues
      bill.revenues.forEach(revenue => {
        totalRevenue += parseFloat(revenue.amount.toString());
      });
    });
    
    // Calculate total costs (both types combined)
    const totalCosts = totalHoaDonCosts + totalTraHoCosts;
    
    // Only use 'Hóa đơn' costs for net profit calculation
    const netProfit = totalRevenue - totalHoaDonCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    const billsByMonth: Record<string, any> = {};
    
    billsInRange.forEach(bill => {
      const date = new Date(bill.date);
      const period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!billsByMonth[period]) {
        billsByMonth[period] = {
          bills: [],
          revenues: [],
          hoaDonCosts: [],
          traHoCosts: []
        };
      }
      
      billsByMonth[period].bills.push(bill);
      
      // Split costs by attribute type
      bill.costs.forEach(cost => {
        const costType = costAttributeMap.get(cost.id) || "Hóa đơn";
        
        if (costType === "Trả hộ") {
          billsByMonth[period].traHoCosts.push(cost);
        } else {
          billsByMonth[period].hoaDonCosts.push(cost);
        }
      });
      
      billsByMonth[period].revenues.push(...bill.revenues);
    });
    
    const periods = Object.keys(billsByMonth).map(period => {
      const periodData = billsByMonth[period];
      const periodRevenue = periodData.revenues.reduce((sum: number, revenue: any) => sum + parseFloat(revenue.amount.toString()), 0);
      
      // Split costs by type for reporting
      const periodHoaDonCosts = periodData.hoaDonCosts.reduce((sum: number, cost: any) => sum + parseFloat(cost.amount.toString()), 0);
      const periodTraHoCosts = periodData.traHoCosts.reduce((sum: number, cost: any) => sum + parseFloat(cost.amount.toString()), 0);
      const periodTotalCosts = periodHoaDonCosts + periodTraHoCosts;
      
      // Only use 'Hóa đơn' costs for profit calculation
      const periodProfit = periodRevenue - periodHoaDonCosts;
      const periodMargin = periodRevenue > 0 ? (periodProfit / periodRevenue) * 100 : 0;
      
      const [year, month] = period.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'long' });
      
      return {
        label: `${monthName} ${year}`,
        billCount: periodData.bills.length,
        revenue: periodRevenue.toFixed(2),
        hoaDonCosts: periodHoaDonCosts.toFixed(2),
        traHoCosts: periodTraHoCosts.toFixed(2),
        totalCosts: periodTotalCosts.toFixed(2),
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
    
    // Generate CSV content with Vietnamese headers
    const headers = [
      'Thời gian', 
      'Số hóa đơn', 
      'Doanh thu', 
      'Chi phí Hóa đơn', 
      'Chi phí Trả hộ', 
      'Tổng chi phí', 
      'Lợi nhuận', 
      'Tỷ suất Lợi nhuận (%)'
    ];
    
    const rows = periods.map(period => [
      period.label,
      period.billCount,
      period.revenue,
      period.hoaDonCosts,
      period.traHoCosts,
      period.totalCosts,
      period.profit,
      period.margin
    ]);
    
    // Add summary row
    rows.push([
      'TỔNG',
      billsInRange.length.toString(),
      totalRevenue.toFixed(2),
      totalHoaDonCosts.toFixed(2),
      totalTraHoCosts.toFixed(2),
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
    res.setHeader('Content-Disposition', 'attachment; filename=bao-cao-loi-nhuan.csv');
    
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
      // Default to last 90 days if no dates provided
      dateTo = new Date();
      dateFrom = subDays(dateTo, 90);
    }
    
    // First, get all the costs with their attribute values to determine which are 'Hóa đơn' vs 'Trả hộ'
    const costsWithAttributes = await db.query.costs.findMany({
      with: {
        attributeValues: {
          with: {
            attribute: true
          }
        }
      }
    });
    
    // Create a map of cost attribute types for quick lookup
    const costAttributeMap = new Map<number, string>();
    
    // Default is to consider as 'Hóa đơn' if not specified
    costsWithAttributes.forEach(cost => {
      // Default to 'Hóa đơn' if no attribute values
      costAttributeMap.set(cost.id, "Hóa đơn");
      
      // If has attribute values, determine type
      if (cost.attributeValues && cost.attributeValues.length > 0) {
        // Find attribute with name 'Trả hộ'
        const traHoAttribute = cost.attributeValues.find(av => 
          av.attribute && av.attribute.name === "Trả hộ" && av.value === "true");
        
        if (traHoAttribute) {
          costAttributeMap.set(cost.id, "Trả hộ");
        }
      }
    });
    
    // Get all bills with costs, revenues, customer, and service relationships
    const billsWithDetails = await db.query.bills.findMany({
      where: between(bills.date, startOfDay(dateFrom).toISOString(), endOfDay(dateTo).toISOString()),
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
    
    // Enhance bill details with cost attribute information and profit calculations
    const enhancedBills = billsWithDetails.map(bill => {
      // Split costs by attribute type ('Hóa đơn' vs 'Trả hộ')
      const hoaDonCosts = bill.costs.filter(cost => 
        costAttributeMap.get(cost.id) === "Hóa đơn");
      const traHoCosts = bill.costs.filter(cost => 
        costAttributeMap.get(cost.id) === "Trả hộ");
      
      // Calculate totals by attribute type
      const totalHoaDonCost = hoaDonCosts.reduce(
        (sum, cost) => sum + parseFloat(cost.amount.toString()), 0);
      const totalTraHoCost = traHoCosts.reduce(
        (sum, cost) => sum + parseFloat(cost.amount.toString()), 0);
        
      // Calculate total revenue
      const totalRevenue = bill.revenues.reduce(
        (sum, revenue) => sum + parseFloat(revenue.amount.toString()), 0);
      
      // For profit calculation, only use 'Hóa đơn' costs
      const profit = totalRevenue - totalHoaDonCost;
      
      // Enhanced costs with attribute information
      const enhancedCosts = bill.costs.map(cost => {
        const costAttribute = costAttributeMap.get(cost.id) || "Hóa đơn";
        return {
          ...cost,
          attribute: costAttribute
        };
      });
      
      return {
        ...bill,
        costs: enhancedCosts,
        totalHoaDonCost,
        totalTraHoCost,
        totalCost: totalHoaDonCost + totalTraHoCost,
        totalRevenue,
        profit
      };
    });
    
    // Log for debugging
    console.log(`Found ${enhancedBills.length} bills for report in range ${dateFrom.toISOString()} to ${dateTo.toISOString()}`);
    
    return res.status(200).json({
      bills: enhancedBills,
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
      // Default to last 90 days if no dates provided
      dateTo = new Date();
      dateFrom = subDays(dateTo, 90);
    }
    
    // First, get all the costs with their attribute values to determine which are 'Hóa đơn' vs 'Trả hộ'
    const costsWithAttributes = await db.query.costs.findMany({
      with: {
        attributeValues: {
          with: {
            attribute: true
          }
        }
      }
    });
    
    // Create a map of cost attribute types for quick lookup
    const costAttributeMap = new Map<number, string>();
    
    // Default is to consider as 'Hóa đơn' if not specified
    costsWithAttributes.forEach(cost => {
      // Default to 'Hóa đơn' if no attribute values
      costAttributeMap.set(cost.id, "Hóa đơn");
      
      // If has attribute values, determine type
      if (cost.attributeValues && cost.attributeValues.length > 0) {
        // Find attribute with name 'Trả hộ'
        const traHoAttribute = cost.attributeValues.find(av => 
          av.attribute && av.attribute.name === "Trả hộ" && av.value === "true");
        
        if (traHoAttribute) {
          costAttributeMap.set(cost.id, "Trả hộ");
        }
      }
    });
    
    // Get all bills with costs, revenues, customer, and service relationships
    const billsWithDetails = await db.query.bills.findMany({
      where: between(bills.date, startOfDay(dateFrom).toISOString(), endOfDay(dateTo).toISOString()),
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
          importExportType: bill.importExportType,
          goodsType: bill.goodsType,
          invoiceNo: bill.invoiceNo || 'N/A',
          supplierName: 'N/A',
          costType: 'N/A',
          costAttribute: 'N/A',
          costAmount: 0,
          revenueAmount: 0,
          profit: 0
        });
        return;
      }
      
      // Calculate total revenue for this bill
      const totalRevenue = bill.revenues.reduce((sum, revenue) => sum + parseFloat(revenue.amount.toString()), 0);
      
      // Split costs by attribute type ('Hóa đơn' vs 'Trả hộ')
      const hoaDonCosts = bill.costs.filter(cost => 
        costAttributeMap.get(cost.id) === "Hóa đơn");
      const traHoCosts = bill.costs.filter(cost => 
        costAttributeMap.get(cost.id) === "Trả hộ");
      
      // Calculate totals by attribute type
      const totalHoaDonCost = hoaDonCosts.reduce(
        (sum, cost) => sum + parseFloat(cost.amount.toString()), 0);
      const totalTraHoCost = traHoCosts.reduce(
        (sum, cost) => sum + parseFloat(cost.amount.toString()), 0);
      
      // For profit calculation, only use 'Hóa đơn' costs
      const profit = totalRevenue - totalHoaDonCost;
      
      // For bills with costs, add one row per cost
      if (bill.costs.length > 0) {
        bill.costs.forEach(cost => {
          // Determine if cost is 'Trả hộ' or 'Hóa đơn'
          const costAttribute = costAttributeMap.get(cost.id) || "Hóa đơn";
          
          // Calculate profit share for this cost
          const costAmount = parseFloat(cost.amount.toString());
          
          // For 'Trả hộ' costs, profit is not calculated (pass-through)
          let profitShare = 0;
          let revenueShare = 0;
          
          if (costAttribute === "Hóa đơn") {
            // Only divide revenue among 'Hóa đơn' costs for profit calculation
            revenueShare = hoaDonCosts.length > 0 ? totalRevenue / hoaDonCosts.length : 0;
            profitShare = revenueShare - costAmount;
          }
          
          csvRows.push({
            billNo: bill.billNo,
            date: bill.date,
            customerName: bill.customer?.name || 'N/A',
            serviceName: bill.service?.name || 'N/A',
            importExportType: bill.importExportType,
            goodsType: bill.goodsType,
            invoiceNo: bill.invoiceNo || 'N/A',
            supplierName: cost.supplier?.name || 'N/A',
            costType: cost.costType?.name || 'N/A',
            costAttribute: costAttribute,
            costAmount: costAmount,
            revenueAmount: revenueShare,
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
          importExportType: bill.importExportType,
          goodsType: bill.goodsType,
          invoiceNo: bill.invoiceNo || 'N/A',
          supplierName: 'N/A',
          costType: 'N/A',
          costAttribute: 'N/A',
          costAmount: 0,
          revenueAmount: totalRevenue,
          profit: totalRevenue
        });
      }
    });
    
    // Create and write CSV file
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const path = require('path');
    const filePath = path.join(__dirname, '..', 'temp', `bill_detail_report_${new Date().getTime()}.csv`);
    
    const csvWriter = createCsvWriter({
      path: filePath,
      header: [
        { id: 'billNo', title: 'Số bill' },
        { id: 'date', title: 'Ngày' },
        { id: 'customerName', title: 'Khách hàng' },
        { id: 'serviceName', title: 'Dịch vụ' },
        { id: 'importExportType', title: 'Loại NK/XK' },
        { id: 'goodsType', title: 'Loại hàng' },
        { id: 'invoiceNo', title: 'Số invoice' },
        { id: 'supplierName', title: 'Nhà cung cấp' },
        { id: 'costType', title: 'Loại chi phí' },
        { id: 'costAttribute', title: 'Thuộc tính' },
        { id: 'costAmount', title: 'Chi phí' },
        { id: 'revenueAmount', title: 'Doanh thu' },
        { id: 'profit', title: 'Lợi nhuận' },
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
