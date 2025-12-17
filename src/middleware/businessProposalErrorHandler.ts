import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getLanguageFromRequest, getTranslations } from '../utils/translations';
import { ErrorResponse } from '../types';

/**
 * Business proposal specific error handling middleware
 * Handles errors specific to business proposal operations
 */

export interface BusinessProposalError extends Error {
  code?: string;
  statusCode?: number;
  proposalId?: string;
  itemId?: string;
  operation?: string;
}

/**
 * Handle business proposal calculation errors
 */
export function handleCalculationError(
  error: BusinessProposalError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId;
  const language = getLanguageFromRequest(req);
  const t = getTranslations(language);

  if (error.message?.includes('calculation') || error.message?.includes('total')) {
    logger.proposalError('CALCULATION', error, error.proposalId);
    
    res.status(400).json({
      message: 'Erro no cálculo dos valores da proposta. Verifique os dados informados.',
      status: 400
    } as ErrorResponse);
    return;
  }

  next(error);
}

/**
 * Handle business proposal status transition errors
 */
export function handleStatusTransitionError(
  error: BusinessProposalError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId;
  const language = getLanguageFromRequest(req);
  const t = getTranslations(language);

  if (error.message?.includes('status') && error.message?.includes('transition')) {
    logger.proposalError('STATUS_TRANSITION', error, error.proposalId);
    
    const statusMessages = {
      'pt-BR': 'Transição de status inválida para esta proposta',
      'en-US': 'Invalid status transition for this proposal',
      'es-CO': 'Transición de estado inválida para esta propuesta'
    };
    
    res.status(400).json({
      message: statusMessages[language] || statusMessages['pt-BR'],
      status: 400
    } as ErrorResponse);
    return;
  }

  next(error);
}

/**
 * Handle business proposal item quantity/pricing errors
 */
export function handleItemValidationError(
  error: BusinessProposalError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId;
  const language = getLanguageFromRequest(req);

  if (error.message?.includes('quantity') || error.message?.includes('price') || error.message?.includes('discount')) {
    logger.proposalItemError('VALIDATION', error, error.itemId, error.proposalId);
    
    const itemMessages = {
      'pt-BR': 'Valores inválidos para o item da proposta. Verifique quantidade, preço e desconto.',
      'en-US': 'Invalid values for proposal item. Check quantity, price and discount.',
      'es-CO': 'Valores inválidos para el artículo de la propuesta. Verifique cantidad, precio y descuento.'
    };
    
    res.status(400).json({
      message: itemMessages[language] || itemMessages['pt-BR'],
      status: 400
    } as ErrorResponse);
    return;
  }

  next(error);
}

/**
 * Handle business proposal cascade deletion errors
 */
export function handleCascadeDeletionError(
  error: BusinessProposalError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId;
  const language = getLanguageFromRequest(req);

  if (error.message?.includes('cascade') || (error.code === '23503' && error.operation === 'DELETE')) {
    logger.proposalError('CASCADE_DELETE', error, error.proposalId);
    
    const cascadeMessages = {
      'pt-BR': 'Erro ao excluir proposta e itens relacionados. Tente novamente.',
      'en-US': 'Error deleting proposal and related items. Please try again.',
      'es-CO': 'Error al eliminar propuesta y artículos relacionados. Inténtelo de nuevo.'
    };
    
    res.status(500).json({
      message: cascadeMessages[language] || cascadeMessages['pt-BR'],
      status: 500
    } as ErrorResponse);
    return;
  }

  next(error);
}

/**
 * Handle business proposal permission errors
 */
export function handlePermissionError(
  error: BusinessProposalError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req as any).requestId;
  const language = getLanguageFromRequest(req);

  if (error.message?.includes('permission') || error.message?.includes('unauthorized') || error.statusCode === 403) {
    logger.securityEvent('UNAUTHORIZED_PROPOSAL_ACCESS', error.message, requestId);
    
    const permissionMessages = {
      'pt-BR': 'Você não tem permissão para realizar esta operação na proposta',
      'en-US': 'You do not have permission to perform this operation on the proposal',
      'es-CO': 'No tiene permisos para realizar esta operación en la propuesta'
    };
    
    res.status(403).json({
      message: permissionMessages[language] || permissionMessages['pt-BR'],
      status: 403
    } as ErrorResponse);
    return;
  }

  next(error);
}

/**
 * Comprehensive business proposal error handler
 * Combines all business proposal specific error handling
 */
export function businessProposalErrorHandler(
  error: BusinessProposalError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Try each specific error handler in sequence
  handleCalculationError(error, req, res, (err) => {
    if (err) {
      handleStatusTransitionError(err, req, res, (err2) => {
        if (err2) {
          handleItemValidationError(err2, req, res, (err3) => {
            if (err3) {
              handleCascadeDeletionError(err3, req, res, (err4) => {
                if (err4) {
                  handlePermissionError(err4, req, res, next);
                }
              });
            }
          });
        }
      });
    }
  });
}

/**
 * Async wrapper for business proposal operations
 * Automatically catches and handles business proposal specific errors
 */
export function asyncBusinessProposalHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: BusinessProposalError) => {
      // Add operation context to error
      error.operation = `${req.method} ${req.path}`;
      
      // Extract proposal/item IDs from request
      if (req.params.id) {
        error.proposalId = req.params.id;
      }
      if (req.params.proposalId) {
        error.proposalId = req.params.proposalId;
      }
      if (req.params.itemId) {
        error.itemId = req.params.itemId;
      }
      
      businessProposalErrorHandler(error, req, res, next);
    });
  };
}