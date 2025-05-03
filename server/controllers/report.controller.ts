import { Request, Response } from "express";
import { db } from "@db";
import { bills, costs, customers, services, suppliers, costTypes, costAttributeValues, costTypeAttributes } from "@shared/schema";
import { eq, and, desc, between, sql, count, sum, avg } from "drizzle-orm";
import { subDays, subMonths, subYears, parseISO, isValid, startOfDay, endOfDay } from "date-fns";

// Helper function has been removed since we now use tt_hd field directly
// No longer need a map to classify costs by attributes

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
    console.log("Generating dashboard data");
    
    // Count total bills
    const billsResult = await db.select({
      count: count()
    }).from(bills);
    
    const totalBills = billsResult[0]?.count || 0;
    
    // Get all bills with costs to calculate revenue from cost prices
    const allBills = await db.query.bills.findMany({
      with: {
        costs: {
          with: {
            costType: true
          }
        },
        customer: true,
        service: true
      }
    });
    
    // Get all cost prices
    const allCostPrices = await db.query.costPrices.findMany({
      with: {
        customer: true,
        service: true,
        costType: true
      }
    });
    
    console.log(`Found ${allBills.length} bills and ${allCostPrices.length} cost prices`);
    
    // Calculate total revenue based on cost prices
    let totalRevenue = 0;
    
    // Process each bill
    allBills.forEach(bill => {
      const customerId = bill.customerId;
      const serviceId = bill.serviceId;
      
      // Only consider Hóa đơn costs for revenue
      const hoaDonCosts = bill.costs.filter(cost => cost.tt_hd === "Hóa đơn");
      
      // Get unique cost type IDs
      const uniqueCostTypeIds = Array.from(new Set(
        hoaDonCosts.map(cost => cost.costTypeId)
      ));
      
      // Calculate revenue from cost prices
      for (const costTypeId of uniqueCostTypeIds) {
        // Find the matching cost price
        const costPrice = allCostPrices.find(price => 
          price.customerId === customerId && 
          price.serviceId === serviceId && 
          price.costTypeId === costTypeId
        );
        
        if (costPrice) {
          totalRevenue += Number(costPrice.price);
          console.log(`Dashboard: Bill ${bill.billNo} - Cost type ${costTypeId} price: ${costPrice.price}`);
        }
      }
    });
    
    // Get all costs to categorize
    const allCosts = await db.query.costs.findMany({
      columns: {
        id: true,
        amount: true,
        tt_hd: true
      }
    });
    
    // Separate costs by tt_hd value
    let totalHoaDonCosts = 0;
    let totalTraHoCosts = 0;
    
    allCosts.forEach(cost => {
      const costType = cost.tt_hd || "Hóa đơn";
      const amount = parseFloat(cost.amount.toString());
      
      if (costType === "Trả hộ") {
        totalTraHoCosts += amount;
      } else { // "Hóa đơn"
        totalHoaDonCosts += amount;
      }
    });
    
    // Calculate total costs (all types combined)
    const totalCosts = totalHoaDonCosts + totalTraHoCosts;
    
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
            costs: true
          }
        }
      }
    });
    
    const customerPerformanceData = customerPerformance.map(customer => {
      let totalCustomerRevenue = 0;
      let totalCustomerHoaDonCosts = 0;
      let totalCustomerTraHoCosts = 0;
      
      customer.bills.forEach(bill => {
        const customerId = bill.customerId;
        const serviceId = bill.serviceId;
        
        // Get costs by type
        const hoaDonCosts = bill.costs.filter(cost => cost.tt_hd === "Hóa đơn");
        const traHoCosts = bill.costs.filter(cost => cost.tt_hd === "Trả hộ");
        
        // Sum costs
        hoaDonCosts.forEach(cost => {
          totalCustomerHoaDonCosts += Number(cost.amount);
        });
        
        traHoCosts.forEach(cost => {
          totalCustomerTraHoCosts += Number(cost.amount);
        });
        
        // Get unique cost type IDs for Hóa đơn costs
        const uniqueCostTypeIds = Array.from(new Set(
          hoaDonCosts.map(cost => cost.costTypeId)
        ));
        
        // Calculate revenue from cost prices
        for (const costTypeId of uniqueCostTypeIds) {
          // Find cost-specific price
          const costPrice = allCostPrices.find(price => 
            price.customerId === customerId && 
            price.serviceId === serviceId && 
            price.costTypeId === costTypeId
          );
          
          if (costPrice) {
            totalCustomerRevenue += Number(costPrice.price);
          }
        }
      });
      
      // Calculate total costs (all types combined)
      const totalCustomerCosts = totalCustomerHoaDonCosts + totalCustomerTraHoCosts;
      
      // Calculate profit based only on 'Hóa đơn' costs
      const profit = totalCustomerRevenue - totalCustomerHoaDonCosts;
      
      return {
        id: customer.id,
        name: customer.name,
        revenue: totalCustomerRevenue,
        hoaDonCosts: totalCustomerHoaDonCosts,
        traHoCosts: totalCustomerTraHoCosts,
        // No longer including Ko hóa đơn costs
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
        }
      }
    });
    
    // Get service performance with cost prices
    const servicePerformanceData = servicePerformance.map(service => {
      let totalServiceRevenue = 0;
      let totalServiceHoaDonCosts = 0;
      let totalServiceTraHoCosts = 0;
        
      // Process all bills for this service
      service.bills.forEach(bill => {
        const customerId = bill.customerId;
        const serviceId = service.id;
          
        // Get costs by type
        const hoaDonCosts = bill.costs.filter(cost => cost.tt_hd === "Hóa đơn");
        const traHoCosts = bill.costs.filter(cost => cost.tt_hd === "Trả hộ");
          
        // Sum costs
        hoaDonCosts.forEach(cost => {
          totalServiceHoaDonCosts += Number(cost.amount);
        });
          
        traHoCosts.forEach(cost => {
          totalServiceTraHoCosts += Number(cost.amount);
        });
          
        // Get unique cost type IDs for Hóa đơn costs
        const uniqueCostTypeIds = Array.from(new Set(
          hoaDonCosts.map(cost => cost.costTypeId)
        ));
          
        // Calculate revenue from cost prices
        for (const costTypeId of uniqueCostTypeIds) {
          // Find cost-specific price
          const costPrice = allCostPrices.find(price => 
            price.customerId === customerId && 
            price.serviceId === serviceId && 
            price.costTypeId === costTypeId
          );
            
          if (costPrice) {
            totalServiceRevenue += Number(costPrice.price);
          }
        }
      });
      
      // Calculate total costs (all types combined)
      const totalServiceCosts = totalServiceHoaDonCosts + totalServiceTraHoCosts;
      
      // Calculate profit based only on 'Hóa đơn' costs
      const profit = totalServiceRevenue - totalServiceHoaDonCosts;
      
      return {
        id: service.id,
        name: service.name,
        revenue: totalServiceRevenue,
        hoaDonCosts: totalServiceHoaDonCosts,
        traHoCosts: totalServiceTraHoCosts,
        // No longer including Ko hóa đơn costs
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
      // No longer including koHoaDonCosts
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
    
    console.log(`Generating customer report for date range: ${dateRange.from.toISOString()} to ${dateRange.to.toISOString()}`);
    
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
            service: true
          }
        }
      }
    });
    
    // Get all cost prices for revenue calculation
    const allCostPrices = await db.query.costPrices.findMany({
      with: {
        customer: true,
        service: true,
        costType: true
      }
    });
    
    console.log(`Found ${customersWithBills.length} customers and ${allCostPrices.length} cost prices`);
    
    // Calculate metrics for each customer
    const customerReports = customersWithBills.map(customer => {
      let totalRevenue = 0;
      let totalHoaDonCosts = 0;
      let totalTraHoCosts = 0;
      
      customer.bills.forEach(bill => {
        const customerId = bill.customerId;
        const serviceId = bill.serviceId;
        
        // Get costs by type
        const hoaDonCosts = bill.costs.filter(cost => cost.tt_hd === "Hóa đơn");
        const traHoCosts = bill.costs.filter(cost => cost.tt_hd === "Trả hộ");
        
        // Sum costs by type
        hoaDonCosts.forEach(cost => {
          totalHoaDonCosts += Number(cost.amount);
        });
        
        traHoCosts.forEach(cost => {
          totalTraHoCosts += Number(cost.amount);
        });
        
        // Calculate revenue based on cost prices
        const uniqueCostTypeIds = Array.from(new Set(
          hoaDonCosts.map(cost => cost.costTypeId)
        ));
        
        // Get revenue from cost prices
        for (const costTypeId of uniqueCostTypeIds) {
          // Find cost-specific price
          const costPrice = allCostPrices.find(price => 
            price.customerId === customerId && 
            price.serviceId === serviceId && 
            price.costTypeId === costTypeId
          );
          
          if (costPrice) {
            totalRevenue += Number(costPrice.price);
            console.log(`Customer ${customer.name}: Bill ${bill.billNo} - Cost type ${costTypeId} price: ${costPrice.price}`);
          }
        }
      });
      
      // Calculate total costs (all types combined)
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
    
    // Calculate totals by tt_hd value
    let totalHoaDonCosts = 0;
    let totalTraHoCosts = 0;
    
    suppliers.forEach(supplier => {
      supplier.costs.forEach(cost => {
        // Apply cost type filter if provided
        if (!costTypeId || cost.costTypeId === Number(costTypeId)) {
          // Get cost attribute directly from tt_hd field
          const costType = cost.tt_hd || "Hóa đơn";
          
          if (costType === "Trả hộ") {
            totalTraHoCosts += parseFloat(cost.amount.toString());
          } else { // "Hóa đơn"
            totalHoaDonCosts += parseFloat(cost.amount.toString());
          }
        }
      });
    });
    
    // Total cost is sum of all types
    const totalCosts = totalHoaDonCosts + totalTraHoCosts;
    
    // Calculate metrics for each supplier
    const supplierReports = suppliers.map(supplier => {
      // Filter costs by cost type if provided
      const filteredCosts = costTypeId 
        ? supplier.costs.filter(cost => cost.costTypeId === Number(costTypeId))
        : supplier.costs;
      
      // Split costs by tt_hd value
      let totalHoaDonAmount = 0;
      let totalTraHoAmount = 0;
      
      filteredCosts.forEach(cost => {
        const costType = cost.tt_hd || "Hóa đơn";
        
        if (costType === "Trả hộ") {
          totalTraHoAmount += parseFloat(cost.amount.toString());
        } else { // "Hóa đơn"
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
    
    console.log(`Generating profit/loss report for date range: ${dateRange.from.toISOString()} to ${dateRange.to.toISOString()}`);
    
    // Get all bills in the date range with related data
    const billsInRange = await db.query.bills.findMany({
      where: between(bills.date, dateRange.from.toISOString(), dateRange.to.toISOString()),
      with: {
        costs: {
          with: {
            costType: true
          }
        },
        customer: true,
        service: true
      },
      orderBy: desc(bills.date)
    });
    
    // Get all cost prices for lookups
    const allCostPrices = await db.query.costPrices.findMany({
      with: {
        customer: true,
        service: true,
        costType: true
      }
    });
    
    console.log(`Found ${billsInRange.length} bills and ${allCostPrices.length} cost prices for report`);
    
    // Calculate summary with tt_hd value differentiation
    let totalRevenue = 0;
    let totalHoaDonCosts = 0;
    let totalTraHoCosts = 0;
    
    // Group bills by month
    const billsByMonth: Record<string, any> = {};
    
    // Process each bill
    billsInRange.forEach(bill => {
      const customerId = bill.customerId;
      const serviceId = bill.serviceId;
      
      // Get the period (month) for this bill
      const date = new Date(bill.date);
      const period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Initialize period data if not already done
      if (!billsByMonth[period]) {
        billsByMonth[period] = {
          bills: [],
          hoaDonCosts: [],
          traHoCosts: [],
          revenue: 0
        };
      }
      
      // Add bill to the period
      billsByMonth[period].bills.push(bill);
      
      // Get unique cost type IDs with Hóa đơn costs for this bill
      const hoaDonCosts = bill.costs.filter(cost => cost.tt_hd === "Hóa đơn");
      const traHoCosts = bill.costs.filter(cost => cost.tt_hd === "Trả hộ");
      
      // Calculate bill costs
      let billHoaDonCost = 0;
      let billTraHoCost = 0;
      let billRevenue = 0;
      
      // Get all unique cost type IDs for Hóa đơn costs
      const uniqueCostTypeIds = Array.from(new Set(
        hoaDonCosts.map(cost => cost.costTypeId)
      ));
      
      // Split costs for period data
      hoaDonCosts.forEach(cost => {
        billHoaDonCost += Number(cost.amount);
        billsByMonth[period].hoaDonCosts.push(cost);
      });
      
      traHoCosts.forEach(cost => {
        billTraHoCost += Number(cost.amount);
        billsByMonth[period].traHoCosts.push(cost);
      });
      
      // Add to totals
      totalHoaDonCosts += billHoaDonCost;
      totalTraHoCosts += billTraHoCost;
      
      // Calculate cost-specific prices revenue for each cost type
      for (const costTypeId of uniqueCostTypeIds) {
        // Find cost-specific price
        const costPrice = allCostPrices.find(price => 
          price.customerId === customerId && 
          price.serviceId === serviceId && 
          price.costTypeId === costTypeId
        );
        
        if (costPrice) {
          const revenue = Number(costPrice.price);
          billRevenue += revenue;
          billsByMonth[period].revenue += revenue;
          console.log(`Bill ${bill.billNo}: Found cost price for type ${costTypeId}: ${revenue}`);
        } else {
          console.log(`Bill ${bill.billNo}: No cost price found for type ${costTypeId}`);
        }
      }
      
      // Add to total revenue
      totalRevenue += billRevenue;
    });
    
    // Calculate total costs
    const totalCosts = totalHoaDonCosts + totalTraHoCosts;
    
    // Calculate net profit (revenue - Hóa đơn costs only)
    const netProfit = totalRevenue - totalHoaDonCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Generate period breakdown
    const periods = Object.keys(billsByMonth).map(period => {
      const periodData = billsByMonth[period];
      
      // Get revenue from period data
      const periodRevenue = periodData.revenue || 0;
      
      // Calculate costs by type
      const periodHoaDonCosts = periodData.hoaDonCosts.reduce(
        (sum: number, cost: any) => sum + Number(cost.amount), 0
      );
      
      const periodTraHoCosts = periodData.traHoCosts.reduce(
        (sum: number, cost: any) => sum + Number(cost.amount), 0
      );
      
      const periodTotalCosts = periodHoaDonCosts + periodTraHoCosts;
      
      // Calculate profit (revenue - Hóa đơn costs only)
      const periodProfit = periodRevenue - periodHoaDonCosts;
      const periodMargin = periodRevenue > 0 ? (periodProfit / periodRevenue) * 100 : 0;
      
      // Format the period label
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
      // Sort periods by date
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
    
    console.log(`Exporting customer report for date range: ${from} to ${to}`);
    
    // Reuse the getReportByCustomer logic
    const dateRange = getDateRange(timeframe as string, from as string, to as string);
    
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
            service: true
          }
        }
      }
    });
    
    // Get all cost prices for revenue calculation
    const allCostPrices = await db.query.costPrices.findMany({
      with: {
        customer: true,
        service: true,
        costType: true
      }
    });
    
    console.log(`Found ${customersWithBills.length} customers for export`);
    
    const customerReports = customersWithBills.map(customer => {
      let totalRevenue = 0;
      let totalHoaDonCosts = 0;
      let totalTraHoCosts = 0;
      
      // Process each bill for this customer
      customer.bills.forEach(bill => {
        const customerId = bill.customerId;
        const serviceId = bill.serviceId;
        
        // Get costs by type
        const hoaDonCosts = bill.costs.filter(cost => cost.tt_hd === "Hóa đơn");
        const traHoCosts = bill.costs.filter(cost => cost.tt_hd === "Trả hộ");
        
        // Sum costs
        hoaDonCosts.forEach(cost => {
          totalHoaDonCosts += Number(cost.amount);
        });
        
        traHoCosts.forEach(cost => {
          totalTraHoCosts += Number(cost.amount);
        });
        
        // Calculate revenue based on cost prices
        const uniqueCostTypeIds = Array.from(new Set(
          hoaDonCosts.map(cost => cost.costTypeId)
        ));
        
        // Get revenue from cost prices
        for (const costTypeId of uniqueCostTypeIds) {
          // Find cost-specific price
          const costPrice = allCostPrices.find(price => 
            price.customerId === customerId && 
            price.serviceId === serviceId && 
            price.costTypeId === costTypeId
          );
          
          if (costPrice) {
            totalRevenue += Number(costPrice.price);
          }
        }
      });
      
      // Calculate total costs (all types combined)
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
    
    // Split totals by tt_hd value
    let totalHoaDonCosts = 0;
    let totalTraHoCosts = 0;
    
    suppliers.forEach(supplier => {
      supplier.costs.forEach(cost => {
        if (!costTypeId || cost.costTypeId === Number(costTypeId)) {
          // Get cost attribute directly from tt_hd field
          const costType = cost.tt_hd || "Hóa đơn";
          
          if (costType === "Trả hộ") {
            totalTraHoCosts += parseFloat(cost.amount.toString());
          } else { // "Hóa đơn"
            totalHoaDonCosts += parseFloat(cost.amount.toString());
          }
        }
      });
    });
    
    // Total of all costs
    const totalCosts = totalHoaDonCosts + totalTraHoCosts;
    
    const supplierReports = suppliers.map(supplier => {
      const filteredCosts = costTypeId 
        ? supplier.costs.filter(cost => cost.costTypeId === Number(costTypeId))
        : supplier.costs;
      
      // Split costs by tt_hd value
      let totalHoaDonAmount = 0;
      let totalTraHoAmount = 0;
      
      filteredCosts.forEach(cost => {
        const costType = cost.tt_hd || "Hóa đơn";
        
        if (costType === "Trả hộ") {
          totalTraHoAmount += parseFloat(cost.amount.toString());
        } else { // "Hóa đơn"
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
    
    console.log(`Exporting profit/loss report for timeframe: ${timeframe}, from: ${from}, to: ${to}`);
    
    // Reuse the getProfitLossReport logic
    const dateRange = getDateRange(timeframe as string, from as string, to as string);
    
    // Get all bills with related data
    const billsInRange = await db.query.bills.findMany({
      where: between(bills.date, dateRange.from.toISOString(), dateRange.to.toISOString()),
      with: {
        costs: {
          with: {
            costType: true
          }
        },
        customer: true,
        service: true
      },
      orderBy: desc(bills.date)
    });
    
    // Get all cost prices for revenue calculation
    const allCostPrices = await db.query.costPrices.findMany({
      with: {
        customer: true,
        service: true,
        costType: true
      }
    });
    
    console.log(`Found ${billsInRange.length} bills for profit/loss export`);
    
    // Calculate summary with cost attribute type differentiation
    let totalRevenue = 0;
    let totalHoaDonCosts = 0;
    let totalTraHoCosts = 0;
    
    // Process each bill
    billsInRange.forEach(bill => {
      const customerId = bill.customerId;
      const serviceId = bill.serviceId;
      
      // Get costs by type
      const hoaDonCosts = bill.costs.filter(cost => cost.tt_hd === "Hóa đơn");
      const traHoCosts = bill.costs.filter(cost => cost.tt_hd === "Trả hộ");
      
      // Sum costs by type
      hoaDonCosts.forEach(cost => {
        totalHoaDonCosts += Number(cost.amount);
      });
      
      traHoCosts.forEach(cost => {
        totalTraHoCosts += Number(cost.amount);
      });
      
      // Calculate revenue from cost prices
      const uniqueCostTypeIds = Array.from(new Set(
        hoaDonCosts.map(cost => cost.costTypeId)
      ));
      
      // Get revenue from cost prices
      for (const costTypeId of uniqueCostTypeIds) {
        // Find the matching cost price
        const costPrice = allCostPrices.find(price => 
          price.customerId === customerId && 
          price.serviceId === serviceId && 
          price.costTypeId === costTypeId
        );
        
        if (costPrice) {
          totalRevenue += Number(costPrice.price);
        }
      }
    });
    
    // Calculate total costs (all types combined)
    const totalCosts = totalHoaDonCosts + totalTraHoCosts;
    
    // Only use 'Hóa đơn' costs for net profit calculation
    const netProfit = totalRevenue - totalHoaDonCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    const billsByMonth: Record<string, any> = {};
    
    // Process each bill and group by month
    billsInRange.forEach(bill => {
      const customerId = bill.customerId;
      const serviceId = bill.serviceId;
      const date = new Date(bill.date);
      const period = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!billsByMonth[period]) {
        billsByMonth[period] = {
          bills: [],
          hoaDonCosts: [],
          traHoCosts: [],
          revenue: 0
        };
      }
      
      billsByMonth[period].bills.push(bill);
      
      // Get costs by type
      const hoaDonCosts = bill.costs.filter(cost => cost.tt_hd === "Hóa đơn");
      const traHoCosts = bill.costs.filter(cost => cost.tt_hd === "Trả hộ");
      
      // Add costs to period data
      billsByMonth[period].hoaDonCosts.push(...hoaDonCosts);
      billsByMonth[period].traHoCosts.push(...traHoCosts);
      
      // Calculate revenue based on cost prices for this bill
      const uniqueCostTypeIds = Array.from(new Set(
        hoaDonCosts.map(cost => cost.costTypeId)
      ));
      
      // Add revenue from cost prices to period data
      for (const costTypeId of uniqueCostTypeIds) {
        const costPrice = allCostPrices.find(price => 
          price.customerId === customerId && 
          price.serviceId === serviceId && 
          price.costTypeId === costTypeId
        );
        
        if (costPrice) {
          billsByMonth[period].revenue += Number(costPrice.price);
        }
      }
    });
    
    const periods = Object.keys(billsByMonth).map(period => {
      const periodData = billsByMonth[period];
      const periodRevenue = periodData.revenue || 0;
      
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
    
    console.log(`Generating bill detail report for date range: ${dateFrom.toISOString()} to ${dateTo.toISOString()}`);
    
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
    
    // Get all prices and cost prices for lookups
    const allPrices = await db.query.prices.findMany({
      with: {
        customer: true,
        service: true
      }
    });
    
    const allCostPrices = await db.query.costPrices.findMany({
      with: {
        customer: true,
        service: true,
        costType: true
      }
    });
    
    console.log(`Found ${allPrices.length} standard prices and ${allCostPrices.length} cost-specific prices`);
    
    // Process each bill to add revenue and profit calculations
    const enhancedBills = await Promise.all(billsWithDetails.map(async (bill) => {
      console.log(`Processing bill ${bill.billNo} (ID: ${bill.id})`);
      
      // Get customer and service IDs for pricing lookups
      const customerId = bill.customerId;
      const serviceId = bill.serviceId;
      
      // Split costs by tt_hd value
      const hoaDonCosts = bill.costs.filter(cost => cost.tt_hd === "Hóa đơn");
      const traHoCosts = bill.costs.filter(cost => cost.tt_hd === "Trả hộ");
      
      // Calculate total costs by type
      const totalHoaDonCost = hoaDonCosts.reduce(
        (sum, cost) => sum + Number(cost.amount), 0);
      const totalTraHoCost = traHoCosts.reduce(
        (sum, cost) => sum + Number(cost.amount), 0);
        
      // Group costs by cost type to calculate price and revenue for each
      const costsByType = [];
      let totalRevenue = 0;
      
      // Get unique cost type IDs with Hóa đơn costs
      const uniqueCostTypeIds = Array.from(new Set(
        hoaDonCosts.map(cost => cost.costTypeId)
      ));
      
      // Calculate revenue for each cost type
      for (const costTypeId of uniqueCostTypeIds) {
        // Get all costs for this type
        const typeCosts = bill.costs.filter(cost => cost.costTypeId === costTypeId);
        const typeHoaDonCosts = typeCosts.filter(cost => cost.tt_hd === "Hóa đơn");
        const typeTraHoCosts = typeCosts.filter(cost => cost.tt_hd === "Trả hộ");
        
        // Calculate total costs for this type
        const hoaDonAmount = typeHoaDonCosts.reduce((sum, cost) => sum + Number(cost.amount), 0);
        const traHoAmount = typeTraHoCosts.reduce((sum, cost) => sum + Number(cost.amount), 0);
        
        // Get the cost type name
        const costTypeName = typeCosts[0]?.costType?.name || 'Unknown';
        
        // First try to find cost-specific price
        const costPrice = allCostPrices.find(price => 
          price.customerId === customerId && 
          price.serviceId === serviceId && 
          price.costTypeId === costTypeId
        );
        
        let revenue = 0;
        let priceSource = "";
        
        if (costPrice) {
          // If we found a cost-specific price, use it
          revenue = Number(costPrice.price);
          priceSource = "cost-specific price";
          console.log(`Bill ${bill.billNo}: Using cost-specific price for costType ${costTypeId}: ${revenue}`);
        } else {
          // No price information available
          priceSource = "none";
          console.log(`Bill ${bill.billNo}: No price found for costType ${costTypeId}`);
        }
        
        // Add the revenue from this cost type to the total
        totalRevenue += revenue;
        
        // Calculate profit (revenue - Hóa đơn costs only)
        const profit = revenue - hoaDonAmount;
        
        costsByType.push({
          costTypeId,
          costTypeName,
          hoaDonCosts: typeHoaDonCosts,
          traHoCosts: typeTraHoCosts,
          hoaDonAmount,
          traHoAmount,
          totalAmount: hoaDonAmount + traHoAmount,
          count: typeCosts.length,
          unitPrice: revenue,
          revenue: revenue,
          profit: profit,
          priceSource: priceSource
        });
      }
      
      // Add any "Trả hộ" costs that don't have an associated "Hóa đơn" cost
      const traHoOnlyCostTypeIds = Array.from(new Set(
        traHoCosts
          .filter(cost => !uniqueCostTypeIds.includes(cost.costTypeId))
          .map(cost => cost.costTypeId)
      ));
      
      for (const costTypeId of traHoOnlyCostTypeIds) {
        const typeCosts = bill.costs.filter(cost => 
          cost.costTypeId === costTypeId && cost.tt_hd === "Trả hộ"
        );
        
        const traHoAmount = typeCosts.reduce((sum, cost) => sum + Number(cost.amount), 0);
        const costTypeName = typeCosts[0]?.costType?.name || 'Unknown';
        
        costsByType.push({
          costTypeId,
          costTypeName,
          hoaDonCosts: [],
          traHoCosts: typeCosts,
          hoaDonAmount: 0,
          traHoAmount,
          totalAmount: traHoAmount,
          count: typeCosts.length,
          unitPrice: 0,
          revenue: 0,
          profit: 0,
          priceSource: "none (Trả hộ only)"
        });
      }
      
      // Calculate overall profit (revenue - Hóa đơn costs only)
      const profit = totalRevenue - totalHoaDonCost;
      
      // Return the enhanced bill with calculated values
      return {
        ...bill,
        totalHoaDonCost,
        totalTraHoCost,
        totalCost: totalHoaDonCost + totalTraHoCost,
        totalRevenue,
        profit,
        costsByType
      };
    }));
    
    console.log(`Completed report with ${enhancedBills.length} bills`);
    
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
    
    console.log(`Exporting bill detail report for date range: ${dateFrom.toISOString()} to ${dateTo.toISOString()}`);
    
    // Get all prices and cost prices for lookups
    const allPrices = await db.query.prices.findMany({
      with: {
        customer: true,
        service: true
      }
    });
    
    const allCostPrices = await db.query.costPrices.findMany({
      with: {
        customer: true,
        service: true,
        costType: true
      }
    });
    
    console.log(`Found ${allPrices.length} standard prices and ${allCostPrices.length} cost-specific prices`);
    
    // Helper functions to find prices
    const findPrice = (customerId: number, serviceId: number) => {
      const foundPrice = allPrices.find(price => 
        price.customerId === customerId && 
        price.serviceId === serviceId
      );
      return foundPrice;
    };
    
    const findCostPrice = (customerId: number, serviceId: number, costTypeId: number) => {
      const foundPrice = allCostPrices.find(price => 
        price.customerId === customerId && 
        price.serviceId === serviceId && 
        price.costTypeId === costTypeId
      );
      return foundPrice;
    };
    
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
    
    console.log(`Processing ${billsWithDetails.length} bills for CSV export`);
    
    // Prepare data for CSV format (flatten nested data)
    const csvRows: any[] = [];
    
    billsWithDetails.forEach(bill => {
      const customerId = bill.customerId;
      const serviceId = bill.serviceId;
      
      console.log(`Processing bill ${bill.billNo} for CSV export`);
      
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
      
      // Calculate total revenue based on cost prices for this bill
      let totalRevenue = 0;
      
      // Get unique cost type IDs with Hóa đơn costs
      const uniqueHoaDonCostTypeIds = Array.from(new Set(
        bill.costs.filter(cost => cost.tt_hd === "Hóa đơn").map(cost => cost.costTypeId)
      ));
      
      // Calculate revenue using cost prices
      for (const costTypeId of uniqueHoaDonCostTypeIds) {
        // Find cost-specific price
        const costPrice = allCostPrices.find(price => 
          price.customerId === bill.customerId && 
          price.serviceId === bill.serviceId && 
          price.costTypeId === costTypeId
        );
        
        if (costPrice) {
          totalRevenue += Number(costPrice.price);
          console.log(`Bill ${bill.billNo}: Using cost price for costType ${costTypeId}: ${costPrice.price}`);
        }
      }
      
      // Group costs by cost type for detailed analysis
      const costByType = bill.costs.reduce((acc: Record<number, any>, cost) => {
        const costTypeId = cost.costTypeId;
        if (!acc[costTypeId]) {
          acc[costTypeId] = {
            costTypeId,
            costTypeName: cost.costType?.name || 'Unknown',
            hoaDonCosts: [],
            traHoCosts: [],
            hoaDonAmount: 0,
            traHoAmount: 0,
            totalAmount: 0,
            count: 0
          };
        }
        
        const amount = parseFloat(cost.amount.toString());
        acc[costTypeId].count += 1;
        acc[costTypeId].totalAmount += amount;
        
        if (cost.tt_hd === "Trả hộ") {
          acc[costTypeId].traHoCosts.push(cost);
          acc[costTypeId].traHoAmount += amount;
        } else { // "Hóa đơn"
          acc[costTypeId].hoaDonCosts.push(cost);
          acc[costTypeId].hoaDonAmount += amount;
        }
        
        return acc;
      }, {});
      
      // Count the number of cost types with Hóa đơn costs
      const costTypesWithHoaDon = Object.values(costByType).filter(
        (type: any) => type.hoaDonCosts.length > 0
      );
      
      // Split costs by tt_hd value for totals
      const hoaDonCosts = bill.costs.filter(cost => cost.tt_hd === "Hóa đơn");
      const traHoCosts = bill.costs.filter(cost => cost.tt_hd === "Trả hộ");
      
      // Calculate totals
      const totalHoaDonCost = hoaDonCosts.reduce(
        (sum, cost) => sum + parseFloat(cost.amount.toString()), 0);
      const totalTraHoCost = traHoCosts.reduce(
        (sum, cost) => sum + parseFloat(cost.amount.toString()), 0);
      
      // For profit calculation, only use 'Hóa đơn' costs
      const profit = totalRevenue - totalHoaDonCost;
      
      // For bills with costs, add rows grouped by cost type
      if (bill.costs.length > 0) {
        // Get the customer and service IDs for price lookup
        const customerId = bill.customerId;
        const serviceId = bill.serviceId;
        
        // Process costs grouped by type
        Object.values(costByType).forEach((costTypeGroup: any) => {
          const costTypeId = costTypeGroup.costTypeId;
          
          // Revenue for the whole bill (we'll only show it once per cost type)
          let showRevenueForType = false;
          
          // Add a row for each cost within this cost type group
          if (costTypeGroup.hoaDonCosts.length > 0) {
            showRevenueForType = true;
            
            // Try to get price from cost price table first for this cost type
            const costPrice = findCostPrice(customerId, serviceId, costTypeGroup.costTypeId);
            let priceFromTable = 0;
            
            if (costPrice) {
              // If we have a cost price for this combination, use it
              priceFromTable = parseFloat(costPrice.price.toString());
            } else {
              // Don't use any fallback methods, only use cost-specific prices
              priceFromTable = 0;
            }
            
            costTypeGroup.hoaDonCosts.forEach((cost: any, index: number) => {
              const costAmount = parseFloat(cost.amount.toString());
              
              // Only show the revenue on the first cost of each type
              const showRevenue = index === 0 && showRevenueForType;
              const revenueForRow = showRevenue ? priceFromTable : 0;
              const profitForRow = showRevenue ? revenueForRow - costTypeGroup.hoaDonAmount : 0;
              
              csvRows.push({
                billNo: bill.billNo,
                date: bill.date,
                customerName: bill.customer?.name || 'N/A',
                serviceName: bill.service?.name || 'N/A',
                importExportType: bill.importExportType,
                goodsType: bill.goodsType,
                invoiceNo: bill.invoiceNo || 'N/A',
                supplierName: cost.supplier?.name || 'N/A',
                costType: costTypeGroup.costTypeName,
                costAttribute: "Hóa đơn",
                costAmount: costAmount,
                revenueAmount: revenueForRow,
                profit: profitForRow
              });
              
              // After showing revenue once, don't show it again for this type
              showRevenueForType = false;
            });
          }
          
          // Add rows for 'Trả hộ' costs (no revenue or profit)
          costTypeGroup.traHoCosts.forEach((cost: any) => {
            csvRows.push({
              billNo: bill.billNo,
              date: bill.date,
              customerName: bill.customer?.name || 'N/A',
              serviceName: bill.service?.name || 'N/A',
              importExportType: bill.importExportType,
              goodsType: bill.goodsType,
              invoiceNo: bill.invoiceNo || 'N/A',
              supplierName: cost.supplier?.name || 'N/A',
              costType: costTypeGroup.costTypeName,
              costAttribute: "Trả hộ",
              costAmount: parseFloat(cost.amount.toString()),
              revenueAmount: 0, // No revenue for 'Trả hộ'
              profit: 0 // No profit for 'Trả hộ'
            });
          });
        });
      }
          // For bills without costs - always return 0 revenue
      else {
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
          revenueAmount: 0, // Always 0 if no cost-specific prices
          profit: 0
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
