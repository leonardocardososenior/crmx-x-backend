import {Request, Response} from 'express';
import {z} from 'zod';
import fetch from 'node-fetch';
import {supabaseAdmin} from '../supabaseClient';
import {SendStatuses} from '../types';
import {handleDatabaseError, handleInternalError, handleValidationError} from '../utils/controllerHelpers';
import {getLanguageFromRequest} from '../utils/translations';
import {logger} from '../utils/logger';

// Schema de validação para o ID da proposta
const SendOrderSchema = z.object({
    proposalId: z.string().uuid('ID da proposta deve ser um UUID válido')
});

const erpUrl = 'https://cloud-leaf.senior.com.br/t/senior.com.br/bridge/1.0/rest/erpx_com_ven/pedido/apis/order'

const itemId = "d9179226-00e6-4e8c-8a46-aee52e7b57f7";
const companyId = "c6b537f7-e16a-499d-99ba-f8391f1fb221";
const branchId = "898cdde1-0161-44bb-bc2c-e625ed45b52c";
const customerId = "4b4411e8-b0f8-4d41-afad-82d57fd6ab0a";
const representId = "4309758d-4f51-4d6d-95e9-fa551b933bbe";
const paymentTermsId = "5701c166-9cc9-4e33-bfd5-bc3e55f73e10";

export interface Company {
    id: string
}

export interface Branch {
    id: string
}

export interface Customer {
    id: string
}

export interface Representative {
    id: string
}

export interface RecDefaultData {
    id: string
}

export interface PaymentMethod {
    id: string
}

export interface Item {
    product: {
        id: string
    }
    price?: number,
    quantity?: number,
    discount?: number
}

export type ExternalIntegration = "CRM";
export type EnumCifFob = "V1"; // ajuste conforme seu enum real

export interface OrderInput {
    /** Id da entidade */
    id?: string;

    /** Dados da empresa */
    company?: Company;

    /** Dados da filial */
    branch?: Branch;

    /** Dados do cliente */
    customer?: Customer;

    /** Dados do representante */
    representative?: Representative;

    /** Dados da condição de pagamento */
    paymentTerms?: RecDefaultData;

    /** Dados da forma de pagamento */
    paymentMethod?: PaymentMethod;

    /** Dados da transportadora */
    shippingCompany?: RecDefaultData;

    /** Dados da transportadora de redespacho */
    redispatchCompany?: RecDefaultData;

    /** Data de emissão */
    issueDate?: string; // "YYYY-MM-DD"

    /** Informações dos itens */
    items: Item[];

    /** Identificação externa do pedido */
    externalId?: string;

    /** Observação do pedido */
    observation?: string;

    /** Valor de frete */
    shippingCost: number;

    /** Valor total de desconto */
    discount: number;

    /** Fechar pedido */
    close: boolean;

    /** Origem externa do pedido */
    origin?: ExternalIntegration;

    /** Data de entrega prevista */
    expectedDeliveryDate?: string; // "YYYY-MM-DD"

    /** Tipo de frete */
    freightType?: EnumCifFob;

    /** Número do pedido do cliente */
    customerOrderNumber?: string;
}

export const defaultOrderInput: OrderInput = {
    company: {
        id: companyId
    },
    branch: {
        id: branchId
    },
    customer: {
        id: customerId
    },
    representative: {
        id: representId
    },
    paymentTerms: {
        id: paymentTermsId
    },
    items: [],
    freightType: "V1",
    shippingCost: 0,
    discount: 0,
    close: false,
    origin: "CRM"
};


/**
 * Send order to ERP
 * POST /api/integration/send-order
 */
export async function sendOrderToERP(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;

    try {
        // Validar o body da requisição
        const validationResult = SendOrderSchema.safeParse(req.body);

        if (!validationResult.success) {
            logger.error('INTEGRATION', 'Validation failed for send order', new Error('Validation failed'), {
                requestId
            });
            handleValidationError(validationResult, res, req);
            return;
        }

        const {proposalId} = validationResult.data;

        logger.info('INTEGRATION', `Starting ERP send process for proposal ${proposalId}`, {
            requestId,
            proposalId
        });

        // Buscar a proposta completa
        const {data: proposalFound, error: proposalError} = await supabaseAdmin
            .from('business_proposal')
            .select('*')
            .eq('id', proposalId)
            .single();

        if (proposalError || !proposalFound) {
            logger.error('INTEGRATION', `Proposal not found: ${proposalId}`, new Error('Proposal not found'), {
                requestId,
                proposalId
            });

            const language = getLanguageFromRequest(req);
            res.status(404).json({
                message: language === 'pt-BR'
                    ? 'Proposta não encontrada'
                    : language === 'es-CO'
                        ? 'Propuesta no encontrada'
                        : 'Proposal not found',
                proposalId
            });
            return;
        }

        // Buscar o business vinculado à proposta
        const {data: businessFound, error: businessError} = await supabaseAdmin
            .from('business')
            .select('*')
            .eq('id', proposalFound.business_id)
            .single();

        if (businessError || !businessFound) {
            logger.error('INTEGRATION', `Business not found for proposal: ${proposalId}`, new Error('Business not found'), {
                requestId,
                proposalId,
                businessId: proposalFound.business_id
            });

            const language = getLanguageFromRequest(req);
            res.status(404).json({
                message: language === 'pt-BR'
                    ? 'Negócio vinculado à proposta não encontrado'
                    : language === 'es-CO'
                        ? 'Negocio vinculado a la propuesta no encontrado'
                        : 'Business linked to proposal not found',
                proposalId
            });
            return;
        }

        // Buscar os itens da proposta
        const {data: proposalItemsFound, error: itemsError} = await supabaseAdmin
            .from('business_proposal_item')
            .select('*')
            .eq('proposal_id', proposalId);

        if (itemsError) {
            logger.error('INTEGRATION', `Error fetching proposal items: ${proposalId}`, itemsError as Error, {
                requestId,
                proposalId
            });

            const language = getLanguageFromRequest(req);
            res.status(500).json({
                message: language === 'pt-BR'
                    ? 'Erro ao buscar itens da proposta'
                    : language === 'es-CO'
                        ? 'Error al buscar items de la propuesta'
                        : 'Error fetching proposal items',
                proposalId
            });
            return;
        }

        logger.info('INTEGRATION', `Proposal data loaded successfully`, {
            requestId,
            proposalId,
            proposalTitle: proposalFound.title,
            proposalValue: proposalFound.value,
            businessId: businessFound.id,
            businessTitle: businessFound.title,
            itemsCount: proposalItemsFound?.length || 0
        });

        try {
            // Extrair o token de autorização do header da requisição
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new Error('Token de autorização não encontrado');
            }

            const token = authHeader.substring(7); // Remove "Bearer " do início

            logger.info('INTEGRATION', `Sending order to ERP: ${erpUrl}`, {
                requestId,
                proposalId
            });

            defaultOrderInput.externalId = proposalId;
            //defaultOrderInput.issueDate = proposalFound.date;
            defaultOrderInput.observation = proposalFound.title;

            proposalItemsFound?.forEach(
                (item) => {
                    let itemErp = {
                        product: {
                            id: itemId
                        },
                        price: item.unit_price,
                        quantity: item.quantity,
                        discount: item.discountValue
                    }

                    defaultOrderInput.items.push(itemErp);
                }
            );

            // Fazer a requisição POST para o ERP
            const erpResponse = await fetch(
                erpUrl,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(defaultOrderInput)
                });

            // Verificar se a resposta foi bem-sucedida
            if (!erpResponse.ok) {
                const errorText = await erpResponse.text();
                const responseMessage = JSON.parse(errorText).message;
                throw new Error(responseMessage);
            }

            // Processar a resposta do ERP
            const erpData = await erpResponse.json() as any;

            logger.info('INTEGRATION', `ERP response received successfully`, {
                requestId,
                proposalId,
                erpData
            });

            // Atualizar a proposta com status de sucesso
            const {error: updateError} = await supabaseAdmin
                .from('business_proposal')
                .update({
                    send_status: SendStatuses.SUCCESS,
                    send_message: null,
                    send_number: null
                })
                .eq('id', proposalId)
                .select()
                .single();

            if (updateError) {
                logger.error('INTEGRATION', 'Failed to update proposal after successful send', updateError as Error, {
                    requestId,
                    proposalId
                });
                handleDatabaseError('UPDATE', 'business_proposal', updateError, res, req);
                return;
            }

            const language = getLanguageFromRequest(req);
            res.status(200).json({
                message: language === 'pt-BR'
                    ? 'Proposta enviada ao ERP com sucesso'
                    : language === 'es-CO'
                        ? 'Propuesta enviada al ERP con éxito'
                        : 'Proposal sent to ERP successfully',
                proposalId,
                sendStatus: SendStatuses.SUCCESS
            });

        } catch (erpError) {
            // Em caso de erro no processo de envio ao ERP
            const errorMessage = erpError instanceof Error ? erpError.message : 'Erro desconhecido ao enviar ao ERP';

            logger.error('INTEGRATION', `ERP send failed for proposal ${proposalId}`, erpError as Error, {
                requestId,
                proposalId,
                errorMessage
            });

            // Atualizar a proposta com status de erro
            const {error: updateError} = await supabaseAdmin
                .from('business_proposal')
                .update({
                    send_status: SendStatuses.ERROR,
                    send_message: errorMessage,
                    send_number: null
                })
                .eq('id', proposalId);

            if (updateError) {
                logger.error('INTEGRATION', 'Failed to update proposal after ERP error', updateError as Error, {
                    requestId,
                    proposalId
                });
            }

            const language = getLanguageFromRequest(req);
            res.status(500).json({
                message: language === 'pt-BR'
                    ? 'Erro ao enviar proposta ao ERP'
                    : language === 'es-CO'
                        ? 'Error al enviar propuesta al ERP'
                        : 'Error sending proposal to ERP',
                proposalId,
                error: errorMessage,
                sendStatus: SendStatuses.ERROR
            });
        }

    } catch (error) {
        handleInternalError('sending order to ERP', error, res, req);
    }
}
