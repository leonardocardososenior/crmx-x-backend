import request from 'supertest';
import app from '../../index';
import { supabaseAdmin } from '../../supabaseClient';
import { BusinessStages } from '../../types';

// Mock Supabase client for integration tests
jest.mock('../../supabaseClient', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

// Mock authentication middleware to bypass auth for testing
jest.mock('../../middleware/auth', () => ({
  requireAuth: (req: any, res: any, next: any) => next()
}));

// Integration tests for dashboard controller
// These tests verify complete HTTP request-response flow with mocked database
describe('Dashboard Controller Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/dashboard/revenue-per-year/:year', () => {
    it('should return monthly revenue data with complete HTTP flow', async () => {
      // Mock database response with test data
      const mockBusinessData = [
        { value: 1000.50, created_at: '2024-01-15T10:00:00.000Z' },
        { value: 2500.75, created_at: '2024-01-25T10:00:00.000Z' },
        { value: 1800.00, created_at: '2024-03-10T10:00:00.000Z' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: mockBusinessData, error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      // Make request to dashboard endpoint
      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/2024')
        .set('locale', 'pt-BR')
        .expect(200);

      // Verify database query was called correctly
      expect(supabaseAdmin.from).toHaveBeenCalledWith('business');
      expect(mockQuery.select).toHaveBeenCalledWith('value, created_at');
      expect(mockQuery.eq).toHaveBeenCalledWith('stage', 'Closed Won');
      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00.000Z');
      expect(mockQuery.lt).toHaveBeenCalledWith('created_at', '2025-01-01T00:00:00.000Z');

      // Verify response structure and data
      expect(response.body).toHaveProperty('Janeiro', 3501.25); // 1000.50 + 2500.75
      expect(response.body).toHaveProperty('Fevereiro', 0);
      expect(response.body).toHaveProperty('Março', 1800.00);
      expect(response.body).toHaveProperty('Abril', 0);
      expect(response.body).toHaveProperty('Maio', 0);
      expect(response.body).toHaveProperty('Junho', 0);
      expect(response.body).toHaveProperty('Julho', 0);
      expect(response.body).toHaveProperty('Agosto', 0);
      expect(response.body).toHaveProperty('Setembro', 0);
      expect(response.body).toHaveProperty('Outubro', 0);
      expect(response.body).toHaveProperty('Novembro', 0);
      expect(response.body).toHaveProperty('Dezembro', 0);

      // Verify all 12 months are present
      expect(Object.keys(response.body)).toHaveLength(12);
    });

    it('should return localized month names for English locale', async () => {
      // Mock database response with February data
      const mockBusinessData = [
        { value: 5000.00, created_at: '2024-02-14T10:00:00.000Z' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: mockBusinessData, error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      // Make request with English locale
      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/2024')
        .set('locale', 'en-US')
        .expect(200);

      // Verify English month names
      expect(response.body).toHaveProperty('January', 0);
      expect(response.body).toHaveProperty('February', 5000.00);
      expect(response.body).toHaveProperty('March', 0);
      expect(response.body).toHaveProperty('April', 0);
      expect(response.body).toHaveProperty('May', 0);
      expect(response.body).toHaveProperty('June', 0);
      expect(response.body).toHaveProperty('July', 0);
      expect(response.body).toHaveProperty('August', 0);
      expect(response.body).toHaveProperty('September', 0);
      expect(response.body).toHaveProperty('October', 0);
      expect(response.body).toHaveProperty('November', 0);
      expect(response.body).toHaveProperty('December', 0);
    });

    it('should return localized month names for Spanish locale', async () => {
      // Mock database response with May data
      const mockBusinessData = [
        { value: 3200.50, created_at: '2024-05-20T10:00:00.000Z' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: mockBusinessData, error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      // Make request with Spanish locale
      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/2024')
        .set('locale', 'es-CO')
        .expect(200);

      // Verify Spanish month names
      expect(response.body).toHaveProperty('Enero', 0);
      expect(response.body).toHaveProperty('Febrero', 0);
      expect(response.body).toHaveProperty('Marzo', 0);
      expect(response.body).toHaveProperty('Abril', 0);
      expect(response.body).toHaveProperty('Mayo', 3200.50);
      expect(response.body).toHaveProperty('Junio', 0);
      expect(response.body).toHaveProperty('Julio', 0);
      expect(response.body).toHaveProperty('Agosto', 0);
      expect(response.body).toHaveProperty('Septiembre', 0);
      expect(response.body).toHaveProperty('Octubre', 0);
      expect(response.body).toHaveProperty('Noviembre', 0);
      expect(response.body).toHaveProperty('Diciembre', 0);
    });

    it('should verify CLOSED_WON filtering in database query', async () => {
      // Mock database response with only CLOSED_WON business
      const mockBusinessData = [
        { value: 1000.00, created_at: '2024-06-15T10:00:00.000Z' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: mockBusinessData, error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      // Make request
      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/2024')
        .set('locale', 'pt-BR')
        .expect(200);

      // Verify that the query filters by CLOSED_WON stage
      expect(mockQuery.eq).toHaveBeenCalledWith('stage', 'Closed Won');
      
      // Only CLOSED_WON business should be included in result
      expect(response.body.Junho).toBe(1000.00);
    });

    it('should return all zeros when no data exists for the year', async () => {
      // Mock empty database response
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      // Make request for year with no data
      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/2025')
        .set('locale', 'pt-BR')
        .expect(200);

      // All months should be zero
      const expectedResponse = {
        'Janeiro': 0,
        'Fevereiro': 0,
        'Março': 0,
        'Abril': 0,
        'Maio': 0,
        'Junho': 0,
        'Julho': 0,
        'Agosto': 0,
        'Setembro': 0,
        'Outubro': 0,
        'Novembro': 0,
        'Dezembro': 0
      };

      expect(response.body).toEqual(expectedResponse);
    });

    it('should handle invalid year parameter', async () => {
      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/invalid')
        .set('locale', 'pt-BR')
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('year');
    });

    it('should handle negative year parameter', async () => {
      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/-2024')
        .set('locale', 'pt-BR')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle unreasonably large year parameter', async () => {
      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/99999')
        .set('locale', 'pt-BR')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should default to Portuguese when unsupported locale is provided', async () => {
      // Mock database response with July data
      const mockBusinessData = [
        { value: 1500.00, created_at: '2024-07-10T10:00:00.000Z' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: mockBusinessData, error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      // Make request with unsupported locale
      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/2024')
        .set('locale', 'fr-FR')
        .expect(200);

      // Should default to Portuguese month names
      expect(response.body).toHaveProperty('Julho', 1500.00);
      expect(response.body).toHaveProperty('Janeiro', 0);
    });

    it('should handle businesses created at year boundaries correctly', async () => {
      // Mock database response with only 2024 businesses (boundary filtering handled by database query)
      const mockBusinessData = [
        { value: 2000.00, created_at: '2024-01-01T00:00:00.000Z' },
        { value: 3000.00, created_at: '2024-12-31T23:59:59.999Z' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: mockBusinessData, error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      // Request 2024 data
      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/2024')
        .set('locale', 'pt-BR')
        .expect(200);

      // Verify correct date range filtering in query
      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2024-01-01T00:00:00.000Z');
      expect(mockQuery.lt).toHaveBeenCalledWith('created_at', '2025-01-01T00:00:00.000Z');

      // Only 2024 businesses should be included
      expect(response.body.Janeiro).toBe(2000);
      expect(response.body.Dezembro).toBe(3000);
      
      // Verify other months are zero
      expect(response.body.Fevereiro).toBe(0);
      expect(response.body.Novembro).toBe(0);
    });

    it('should handle decimal values correctly', async () => {
      // Mock database response with decimal values
      const mockBusinessData = [
        { value: 1234.56, created_at: '2024-08-15T10:00:00.000Z' },
        { value: 987.44, created_at: '2024-08-20T10:00:00.000Z' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: mockBusinessData, error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/2024')
        .set('locale', 'pt-BR')
        .expect(200);

      // Should correctly sum decimal values
      expect(response.body.Agosto).toBe(2222.00); // 1234.56 + 987.44
    });

    it('should handle large revenue values', async () => {
      // Mock database response with large value
      const mockBusinessData = [
        { value: 999999.99, created_at: '2024-09-15T10:00:00.000Z' }
      ];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: mockBusinessData, error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/2024')
        .set('locale', 'pt-BR')
        .expect(200);

      expect(response.body.Setembro).toBe(999999.99);
    });

    it('should return appropriate HTTP headers', async () => {
      // Mock empty database response
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/2024')
        .set('locale', 'pt-BR')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database connection failed', code: 'DB_ERROR' }
        })
      };

      (supabaseAdmin.from as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app)
        .get('/api/dashboard/revenue-per-year/2024')
        .set('locale', 'pt-BR')
        .expect(500);

      expect(response.body).toHaveProperty('message');
    });
  });
});