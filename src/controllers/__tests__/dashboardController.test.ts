import { Request, Response } from 'express';
import { getRevenuePerYear, getMoreSalesByResponsible } from '../dashboardController';
import { supabaseAdmin } from '../../supabaseClient';

// Mock Supabase client
jest.mock('../../supabaseClient', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

// Mock controller helpers
jest.mock('../../utils/controllerHelpers', () => ({
  handleValidationError: jest.fn(),
  handleDatabaseError: jest.fn(),
  handleInternalError: jest.fn()
}));

// Mock translations
jest.mock('../../utils/translations', () => ({
  getLanguageFromRequest: jest.fn(() => 'pt-BR'),
  createLocalizedMonthlyResponse: jest.fn((data) => {
    const response: Record<string, number> = {};
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    // Initialize all months with zero
    monthNames.forEach((name, index) => {
      response[name] = 0;
    });
    
    // Fill in actual data
    data.forEach(({ month, revenue }: { month: number; revenue: number }) => {
      response[monthNames[month - 1]] = revenue;
    });
    
    return response;
  })
}));

describe('Dashboard Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    
    mockRequest = {
      params: { year: '2024' },
      headers: { locale: 'pt-BR' }
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson
    };

    jest.clearAllMocks();
  });

  describe('getRevenuePerYear', () => {
    it('should return monthly revenue data for a valid year', async () => {
      // Mock successful database response
      const mockBusinessData = [
        { value: 1000, created_at: '2024-01-15T10:00:00.000Z' },
        { value: 2000, created_at: '2024-01-20T10:00:00.000Z' },
        { value: 1500, created_at: '2024-02-10T10:00:00.000Z' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: mockBusinessData, error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await getRevenuePerYear(mockRequest as Request, mockResponse as Response);

      // Verify database query was called correctly
      expect(supabaseAdmin.from).toHaveBeenCalledWith('business');
      expect(mockQuery.select).toHaveBeenCalledWith('value, created_at');
      expect(mockQuery.eq).toHaveBeenCalledWith('stage', 'Closed Won');
      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00.000Z');
      expect(mockQuery.lt).toHaveBeenCalledWith('created_at', '2025-01-01T00:00:00.000Z');

      // Verify response
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        'Janeiro': 3000, // 1000 + 2000
        'Fevereiro': 1500,
        'Março': 0,
        // ... other months should be 0
      }));
    });

    it('should handle empty data gracefully', async () => {
      // Mock empty database response
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      await getRevenuePerYear(mockRequest as Request, mockResponse as Response);

      // Verify response with all zeros
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        'Janeiro': 0,
        'Fevereiro': 0,
        'Março': 0,
        // ... all months should be 0
      }));
    });
  });

  describe('getMoreSalesByResponsible', () => {
    it('should return sales data aggregated by responsible users', async () => {
      // Mock successful database response
      const mockBusinessData = [
        { 
          value: 1000, 
          responsible_id: 'user1',
          users: { id: 'user1', name: 'John Doe' }
        },
        { 
          value: 2000, 
          responsible_id: 'user1',
          users: { id: 'user1', name: 'John Doe' }
        },
        { 
          value: 1500, 
          responsible_id: 'user2',
          users: { id: 'user2', name: 'Jane Smith' }
        }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockResolvedValue({ data: mockBusinessData, error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      mockRequest = {};
      
      await getMoreSalesByResponsible(mockRequest as Request, mockResponse as Response);

      // Verify database query was called correctly
      expect(supabaseAdmin.from).toHaveBeenCalledWith('business');
      expect(mockQuery.select).toHaveBeenCalledWith(`
        value,
        responsible_id,
        users!inner(id, name)
      `);
      expect(mockQuery.eq).toHaveBeenCalledWith('stage', 'Closed Won');
      expect(mockQuery.not).toHaveBeenCalledWith('responsible_id', 'is', null);

      // Verify response - should be sorted by sale value ascending
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith([
        {
          responsibleId: 'user2',
          responsibleName: 'Jane Smith',
          saleValue: 1500
        },
        {
          responsibleId: 'user1',
          responsibleName: 'John Doe',
          saleValue: 3000
        }
      ]);
    });

    it('should handle empty data gracefully', async () => {
      // Mock empty database response
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      mockRequest = {};
      
      await getMoreSalesByResponsible(mockRequest as Request, mockResponse as Response);

      // Verify response with empty array
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith([]);
    });
  });
});