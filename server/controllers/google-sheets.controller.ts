import { Request, Response } from "express";
import { db } from "@db";
import { settings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { GoogleSheetsService } from "../services/google-sheets.service";

export const getSettings = async (req: Request, res: Response) => {
  try {
    // Get Google Sheets settings
    const spreadsheetIdSetting = await db.query.settings.findFirst({
      where: eq(settings.key, 'google_sheets_spreadsheet_id')
    });
    
    const autoSyncSetting = await db.query.settings.findFirst({
      where: eq(settings.key, 'google_sheets_auto_sync')
    });
    
    const lastSyncSetting = await db.query.settings.findFirst({
      where: eq(settings.key, 'google_sheets_last_sync')
    });
    
    // Initialize the service to check connection status
    const googleSheetsService = new GoogleSheetsService();
    const connected = await googleSheetsService.isConnected(spreadsheetIdSetting?.value);
    
    return res.status(200).json({
      spreadsheetId: spreadsheetIdSetting?.value || '',
      autoSync: autoSyncSetting?.value === 'true',
      connected,
      lastSynced: lastSyncSetting?.value || null
    });
  } catch (error) {
    console.error("Error getting Google Sheets settings:", error);
    return res.status(500).json({
      message: "Server error getting Google Sheets settings"
    });
  }
};

export const saveSettings = async (req: Request, res: Response) => {
  try {
    const { spreadsheetId, autoSync } = req.body;
    
    if (spreadsheetId === undefined) {
      return res.status(400).json({
        message: "Spreadsheet ID is required"
      });
    }
    
    // Update or create spreadsheet ID setting
    const existingSpreadsheetIdSetting = await db.query.settings.findFirst({
      where: eq(settings.key, 'google_sheets_spreadsheet_id')
    });
    
    if (existingSpreadsheetIdSetting) {
      await db.update(settings)
        .set({
          value: spreadsheetId,
          updatedAt: new Date()
        })
        .where(eq(settings.key, 'google_sheets_spreadsheet_id'));
    } else {
      await db.insert(settings).values({
        key: 'google_sheets_spreadsheet_id',
        value: spreadsheetId
      });
    }
    
    // Update or create auto sync setting
    const existingAutoSyncSetting = await db.query.settings.findFirst({
      where: eq(settings.key, 'google_sheets_auto_sync')
    });
    
    if (existingAutoSyncSetting) {
      await db.update(settings)
        .set({
          value: autoSync ? 'true' : 'false',
          updatedAt: new Date()
        })
        .where(eq(settings.key, 'google_sheets_auto_sync'));
    } else {
      await db.insert(settings).values({
        key: 'google_sheets_auto_sync',
        value: autoSync ? 'true' : 'false'
      });
    }
    
    // Initialize the service to check connection status
    const googleSheetsService = new GoogleSheetsService();
    const connected = await googleSheetsService.isConnected(spreadsheetId);
    
    return res.status(200).json({
      spreadsheetId,
      autoSync,
      connected
    });
  } catch (error) {
    console.error("Error saving Google Sheets settings:", error);
    return res.status(500).json({
      message: "Server error saving Google Sheets settings"
    });
  }
};

export const testConnection = async (req: Request, res: Response) => {
  try {
    const { spreadsheetId } = req.body;
    
    if (!spreadsheetId) {
      return res.status(400).json({
        message: "Spreadsheet ID is required"
      });
    }
    
    // Try to connect to the spreadsheet
    const googleSheetsService = new GoogleSheetsService();
    const connected = await googleSheetsService.isConnected(spreadsheetId);
    
    if (!connected) {
      return res.status(400).json({
        message: "Could not connect to the spreadsheet. Please check the ID and make sure the service account has access."
      });
    }
    
    return res.status(200).json({
      message: "Successfully connected to the spreadsheet",
      connected: true
    });
  } catch (error) {
    console.error("Error testing Google Sheets connection:", error);
    return res.status(500).json({
      message: "Server error testing Google Sheets connection"
    });
  }
};

export const syncData = async (req: Request, res: Response) => {
  try {
    // Get spreadsheet ID from settings
    const spreadsheetIdSetting = await db.query.settings.findFirst({
      where: eq(settings.key, 'google_sheets_spreadsheet_id')
    });
    
    if (!spreadsheetIdSetting || !spreadsheetIdSetting.value) {
      return res.status(400).json({
        message: "Spreadsheet ID not configured. Please set up Google Sheets integration first."
      });
    }
    
    // Initialize service and sync data
    const googleSheetsService = new GoogleSheetsService();
    const syncResult = await googleSheetsService.syncAllData(spreadsheetIdSetting.value);
    
    if (!syncResult.success) {
      return res.status(400).json({
        message: `Sync failed: ${syncResult.error}`
      });
    }
    
    // Update last sync timestamp
    const existingLastSyncSetting = await db.query.settings.findFirst({
      where: eq(settings.key, 'google_sheets_last_sync')
    });
    
    if (existingLastSyncSetting) {
      await db.update(settings)
        .set({
          value: new Date().toISOString(),
          updatedAt: new Date()
        })
        .where(eq(settings.key, 'google_sheets_last_sync'));
    } else {
      await db.insert(settings).values({
        key: 'google_sheets_last_sync',
        value: new Date().toISOString()
      });
    }
    
    return res.status(200).json({
      message: "Data successfully synced with Google Sheets",
      syncedSheets: syncResult.sheets
    });
  } catch (error) {
    console.error("Error syncing data with Google Sheets:", error);
    return res.status(500).json({
      message: "Server error syncing data with Google Sheets"
    });
  }
};
