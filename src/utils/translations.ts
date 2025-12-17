// Sistema de traduções para mensagens de erro e sucesso
export type Language = 'pt-BR' | 'en-US' | 'es-CO';

export interface Translations {
  errors: {
    validation: {
      required: string;
      invalid_email: string;
      invalid_uuid: string;
      invalid_data: string;
      min_length: string;
      max_length: string;
      invalid_number: string;
      invalid_date: string;
    };
    tenant: {
      header_missing: string;
      header_empty: string;
      format_invalid: string;
      id_malformed: string;
      schema_creation_failed: string;
      schema_migration_failed: string;
      schema_validation_failed: string;
      schema_access_denied: string;
      database_unavailable: string;
      database_connection_timeout: string;
      database_connection_failed: string;
      context_setup_failed: string;
      context_cleanup_failed: string;
      search_path_update_failed: string;
    };
    relationships: {
      owner_not_found: string;
      account_not_found: string;
      manager_not_found: string;
      user_not_found: string;
      business_not_found: string;
      timeline_account_not_found: string;
      timeline_creator_not_found: string;
      relationship_error: string;
      proposal_not_found: string;
      proposal_item_not_found: string;
      item_not_found: string;
    };
    constraints: {
      duplicate_record: string;
      cannot_delete_with_relations: string;
      data_constraint_violation: string;
    };
    filter: {
      invalid_syntax: string;
    };
    not_found: {
      account: string;
      user: string;
      business: string;
      item: string;
      timeline: string;
      proposal: string;
      proposal_item: string;
      route: string;
    };
    server: {
      internal_error: string;
      service_unavailable: string;
      external_service_error: string;
      timeout_error: string;
      rate_limit_exceeded: string;
    };
  };
  success: {
    deleted: {
      account: string;
      user: string;
      business: string;
      item: string;
      timeline: string;
      proposal: string;
      proposal_item: string;
    };
    created: {
      item: string;
      timeline: string;
      proposal: string;
      proposal_item: string;
    };
    updated: {
      item: string;
      timeline: string;
      proposal: string;
      proposal_item: string;
    };
  };
  fields: {
    name: string;
    email: string;
    segment: string;
    responsibleId: string;
    status: string;
    type: string;
    pipeline: string;
    phone: string;
    cnpj: string;
    instagram: string;
    linkedin: string;
    whatsapp: string;
    role: string;
    managerId: string;
    title: string;
    accountId: string;
    value: string;
    currency: string;
    stage: string;
    probability: string;
    closingDate: string;
    id: string;
    page: string;
    size: string;
    filter: string;
    price: string;
    skuCode: string;
    description: string;
    // AccountTimeline fields
    date: string;
    createdBy: string;
    // BusinessProposal fields
    businessId: string;
    content: string;
    themeColor: string;
    termsAndConditions: string;
    showUnitPrices: string;
    sendMessage: string;
    sendStatus: string;
    sendNumber: string;
    // BusinessProposalItem fields
    proposalId: string;
    itemId: string;
    quantity: string;
    unitPrice: string;
    discount: string;
    total: string;
  };
  timeline_types: {
    NOTE: string;
    CALL: string;
    EMAIL: string;
    MEETING: string;
    SYSTEM: string;
  };
}

const translations: Record<Language, Translations> = {
  'pt-BR': {
    errors: {
      validation: {
        required: 'é obrigatório',
        invalid_email: 'deve ser um email válido',
        invalid_uuid: 'deve ser um ID válido',
        invalid_data: 'contém dados inválidos',
        min_length: 'deve ter pelo menos {min} caracteres',
        max_length: 'deve ter no máximo {max} caracteres',
        invalid_number: 'deve ser um número válido',
        invalid_date: 'deve ser uma data válida',
      },
      tenant: {
        header_missing: 'Cabeçalho do tenant é obrigatório',
        header_empty: 'Cabeçalho do tenant não pode estar vazio',
        format_invalid: 'Formato do tenant inválido',
        id_malformed: 'Formato do tenant inválido',
        schema_creation_failed: 'Falha ao criar schema do tenant',
        schema_migration_failed: 'Falha ao executar migração do schema',
        schema_validation_failed: 'Falha na validação do schema',
        schema_access_denied: 'Acesso negado ao schema do tenant',
        database_unavailable: 'Serviço de banco de dados indisponível',
        database_connection_timeout: 'Timeout na conexão com o banco de dados',
        database_connection_failed: 'Falha ao conectar com o banco de dados',
        context_setup_failed: 'Falha ao configurar contexto do tenant',
        context_cleanup_failed: 'Falha ao limpar recursos do tenant',
        search_path_update_failed: 'Falha ao atualizar caminho de busca do banco',
      },
      relationships: {
        owner_not_found: 'O responsável informado não existe',
        account_not_found: 'A conta informada não existe',
        manager_not_found: 'O gerente informado não existe',
        user_not_found: 'O usuário informado não existe',
        business_not_found: 'O negócio informado não existe',
        timeline_account_not_found: 'A conta informada para o timeline não existe',
        timeline_creator_not_found: 'O usuário criador do timeline não existe',
        relationship_error: 'Erro de relacionamento entre registros',
        proposal_not_found: 'A proposta informada não existe',
        proposal_item_not_found: 'O item da proposta informado não existe',
        item_not_found: 'O item informado não existe',
      },
      constraints: {
        duplicate_record: 'Já existe um registro com essas informações',
        cannot_delete_with_relations: 'Não é possível excluir: existem registros relacionados',
        data_constraint_violation: 'Os dados violam as regras do sistema',
      },
      filter: {
        invalid_syntax: 'A sintaxe do filtro é inválida',
      },
      not_found: {
        account: 'Conta não encontrada',
        user: 'Usuário não encontrado',
        business: 'Negócio não encontrado',
        item: 'Item não encontrado',
        timeline: 'Timeline não encontrado',
        proposal: 'Proposta não encontrada',
        proposal_item: 'Item da proposta não encontrado',
        route: 'Rota não encontrada',
      },
      server: {
        internal_error: 'Erro interno do servidor',
        service_unavailable: 'Serviço temporariamente indisponível',
        external_service_error: 'Erro no serviço externo',
        timeout_error: 'Tempo limite da requisição excedido',
        rate_limit_exceeded: 'Muitas requisições. Tente novamente mais tarde',
      },
    },
    success: {
      deleted: {
        account: 'Conta excluída com sucesso',
        user: 'Usuário excluído com sucesso',
        business: 'Negócio excluído com sucesso',
        item: 'Item excluído com sucesso',
        timeline: 'Timeline excluído com sucesso',
        proposal: 'Proposta excluída com sucesso',
        proposal_item: 'Item da proposta excluído com sucesso',
      },
      created: {
        item: 'Item criado com sucesso',
        timeline: 'Timeline criado com sucesso',
        proposal: 'Proposta criada com sucesso',
        proposal_item: 'Item da proposta criado com sucesso',
      },
      updated: {
        item: 'Item atualizado com sucesso',
        timeline: 'Timeline atualizado com sucesso',
        proposal: 'Proposta atualizada com sucesso',
        proposal_item: 'Item da proposta atualizado com sucesso',
      },
    },
    fields: {
      name: 'Nome',
      email: 'Email',
      segment: 'Segmento',
      responsibleId: 'Responsável',
      status: 'Status',
      type: 'Tipo',
      pipeline: 'Pipeline',
      phone: 'Telefone',
      cnpj: 'CNPJ',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      whatsapp: 'WhatsApp',
      role: 'Função',
      managerId: 'Gerente',
      title: 'Título',
      accountId: 'Conta',
      value: 'Valor',
      currency: 'Moeda',
      stage: 'Estágio',
      probability: 'Probabilidade',
      closingDate: 'Data de fechamento',
      id: 'ID',
      page: 'Página',
      size: 'Tamanho',
      filter: 'Filtro',
      price: 'Preço',
      skuCode: 'Código SKU',
      description: 'Descrição',
      // AccountTimeline fields
      date: 'Data',
      createdBy: 'Criado por',
      // BusinessProposal fields
      businessId: 'Negócio',
      content: 'Conteúdo',
      themeColor: 'Cor do tema',
      termsAndConditions: 'Termos e condições',
      showUnitPrices: 'Mostrar preços unitários',
      sendMessage: 'Mensagem de envio',
      sendStatus: 'Status de envio',
      sendNumber: 'Número de envio',
      // BusinessProposalItem fields
      proposalId: 'Proposta',
      itemId: 'Item',
      quantity: 'Quantidade',
      unitPrice: 'Preço unitário',
      discount: 'Desconto',
      total: 'Total',
    },
    timeline_types: {
      NOTE: 'Nota',
      CALL: 'Chamada',
      EMAIL: 'Email',
      MEETING: 'Reunião',
      SYSTEM: 'Sistema',
    },
  },
  'en-US': {
    errors: {
      validation: {
        required: 'is required',
        invalid_email: 'must be a valid email',
        invalid_uuid: 'must be a valid ID',
        invalid_data: 'contains invalid data',
        min_length: 'must have at least {min} characters',
        max_length: 'must have at most {max} characters',
        invalid_number: 'must be a valid number',
        invalid_date: 'must be a valid date',
      },
      tenant: {
        header_missing: 'Tenant header is required',
        header_empty: 'Tenant header cannot be empty',
        format_invalid: 'Invalid tenant format',
        id_malformed: 'Invalid tenant format',
        schema_creation_failed: 'Failed to create tenant schema',
        schema_migration_failed: 'Failed to execute schema migration',
        schema_validation_failed: 'Schema validation failed',
        schema_access_denied: 'Access denied to tenant schema',
        database_unavailable: 'Database service is currently unavailable',
        database_connection_timeout: 'Database connection timeout',
        database_connection_failed: 'Failed to connect to database',
        context_setup_failed: 'Failed to setup tenant context',
        context_cleanup_failed: 'Failed to cleanup tenant resources',
        search_path_update_failed: 'Failed to update database search path',
      },
      relationships: {
        owner_not_found: 'The specified owner does not exist',
        account_not_found: 'The specified account does not exist',
        manager_not_found: 'The specified manager does not exist',
        user_not_found: 'The specified user does not exist',
        business_not_found: 'The specified business does not exist',
        timeline_account_not_found: 'The specified account for timeline does not exist',
        timeline_creator_not_found: 'The specified timeline creator does not exist',
        relationship_error: 'Relationship error between records',
        proposal_not_found: 'The specified proposal does not exist',
        proposal_item_not_found: 'The specified proposal item does not exist',
        item_not_found: 'The specified item does not exist',
      },
      constraints: {
        duplicate_record: 'A record with this information already exists',
        cannot_delete_with_relations: 'Cannot delete: related records exist',
        data_constraint_violation: 'Data violates system rules',
      },
      filter: {
        invalid_syntax: 'Filter syntax is invalid',
      },
      not_found: {
        account: 'Account not found',
        user: 'User not found',
        business: 'Business not found',
        item: 'Item not found',
        timeline: 'Timeline not found',
        proposal: 'Proposal not found',
        proposal_item: 'Proposal item not found',
        route: 'Route not found',
      },
      server: {
        internal_error: 'Internal server error',
        service_unavailable: 'Service temporarily unavailable',
        external_service_error: 'External service error',
        timeout_error: 'Request timeout exceeded',
        rate_limit_exceeded: 'Too many requests. Please try again later',
      },
    },
    success: {
      deleted: {
        account: 'Account deleted successfully',
        user: 'User deleted successfully',
        business: 'Business deleted successfully',
        item: 'Item deleted successfully',
        timeline: 'Timeline deleted successfully',
        proposal: 'Proposal deleted successfully',
        proposal_item: 'Proposal item deleted successfully',
      },
      created: {
        item: 'Item created successfully',
        timeline: 'Timeline created successfully',
        proposal: 'Proposal created successfully',
        proposal_item: 'Proposal item created successfully',
      },
      updated: {
        item: 'Item updated successfully',
        timeline: 'Timeline updated successfully',
        proposal: 'Proposal updated successfully',
        proposal_item: 'Proposal item updated successfully',
      },
    },
    fields: {
      name: 'Name',
      email: 'Email',
      segment: 'Segment',
      responsibleId: 'Owner',
      status: 'Status',
      type: 'Type',
      pipeline: 'Pipeline',
      phone: 'Phone',
      cnpj: 'CNPJ',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      whatsapp: 'WhatsApp',
      role: 'Role',
      managerId: 'Manager',
      title: 'Title',
      accountId: 'Account',
      value: 'Value',
      currency: 'Currency',
      stage: 'Stage',
      probability: 'Probability',
      closingDate: 'Closing date',
      id: 'ID',
      page: 'Page',
      size: 'Size',
      filter: 'Filter',
      price: 'Price',
      skuCode: 'SKU Code',
      description: 'Description',
      // AccountTimeline fields
      date: 'Date',
      createdBy: 'Created by',
      // BusinessProposal fields
      businessId: 'Business',
      content: 'Content',
      themeColor: 'Theme color',
      termsAndConditions: 'Terms and conditions',
      showUnitPrices: 'Show unit prices',
      sendMessage: 'Send message',
      sendStatus: 'Send status',
      sendNumber: 'Send number',
      // BusinessProposalItem fields
      proposalId: 'Proposal',
      itemId: 'Item',
      quantity: 'Quantity',
      unitPrice: 'Unit price',
      discount: 'Discount',
      total: 'Total',
    },
    timeline_types: {
      NOTE: 'Note',
      CALL: 'Call',
      EMAIL: 'Email',
      MEETING: 'Meeting',
      SYSTEM: 'System',
    },
  },
  'es-CO': {
    errors: {
      validation: {
        required: 'es obligatorio',
        invalid_email: 'debe ser un email válido',
        invalid_uuid: 'debe ser un ID válido',
        invalid_data: 'contiene datos inválidos',
        min_length: 'debe tener al menos {min} caracteres',
        max_length: 'debe tener como máximo {max} caracteres',
        invalid_number: 'debe ser un número válido',
        invalid_date: 'debe ser una fecha válida',
      },
      tenant: {
        header_missing: 'Encabezado del tenant es obligatorio',
        header_empty: 'Encabezado del tenant no puede estar vacío',
        format_invalid: 'Formato del tenant inválido',
        id_malformed: 'Formato del tenant inválido',
        schema_creation_failed: 'Error al crear esquema del tenant',
        schema_migration_failed: 'Error al ejecutar migración del esquema',
        schema_validation_failed: 'Error en la validación del esquema',
        schema_access_denied: 'Acceso denegado al esquema del tenant',
        database_unavailable: 'Servicio de base de datos no disponible',
        database_connection_timeout: 'Timeout en la conexión con la base de datos',
        database_connection_failed: 'Error al conectar con la base de datos',
        context_setup_failed: 'Error al configurar contexto del tenant',
        context_cleanup_failed: 'Error al limpiar recursos del tenant',
        search_path_update_failed: 'Error al actualizar ruta de búsqueda de la base de datos',
      },
      relationships: {
        owner_not_found: 'El responsable especificado no existe',
        account_not_found: 'La cuenta especificada no existe',
        manager_not_found: 'El gerente especificado no existe',
        user_not_found: 'El usuario especificado no existe',
        business_not_found: 'El negocio especificado no existe',
        timeline_account_not_found: 'La cuenta especificada para el timeline no existe',
        timeline_creator_not_found: 'El usuario creador del timeline no existe',
        relationship_error: 'Error de relación entre registros',
        proposal_not_found: 'La propuesta especificada no existe',
        proposal_item_not_found: 'El artículo de la propuesta especificado no existe',
        item_not_found: 'El artículo especificado no existe',
      },
      constraints: {
        duplicate_record: 'Ya existe un registro con esta información',
        cannot_delete_with_relations: 'No se puede eliminar: existen registros relacionados',
        data_constraint_violation: 'Los datos violan las reglas del sistema',
      },
      filter: {
        invalid_syntax: 'La sintaxis del filtro es inválida',
      },
      not_found: {
        account: 'Cuenta no encontrada',
        user: 'Usuario no encontrado',
        business: 'Negocio no encontrado',
        item: 'Artículo no encontrado',
        timeline: 'Timeline no encontrado',
        proposal: 'Propuesta no encontrada',
        proposal_item: 'Artículo de propuesta no encontrado',
        route: 'Ruta no encontrada',
      },
      server: {
        internal_error: 'Error interno del servidor',
        service_unavailable: 'Servicio temporalmente no disponible',
        external_service_error: 'Error en servicio externo',
        timeout_error: 'Tiempo límite de solicitud excedido',
        rate_limit_exceeded: 'Demasiadas solicitudes. Inténtelo de nuevo más tarde',
      },
    },
    success: {
      deleted: {
        account: 'Cuenta eliminada exitosamente',
        user: 'Usuario eliminado exitosamente',
        business: 'Negocio eliminado exitosamente',
        item: 'Artículo eliminado exitosamente',
        timeline: 'Timeline eliminado exitosamente',
        proposal: 'Propuesta eliminada exitosamente',
        proposal_item: 'Artículo de propuesta eliminado exitosamente',
      },
      created: {
        item: 'Artículo creado exitosamente',
        timeline: 'Timeline creado exitosamente',
        proposal: 'Propuesta creada exitosamente',
        proposal_item: 'Artículo de propuesta creado exitosamente',
      },
      updated: {
        item: 'Artículo actualizado exitosamente',
        timeline: 'Timeline actualizado exitosamente',
        proposal: 'Propuesta actualizada exitosamente',
        proposal_item: 'Artículo de propuesta actualizado exitosamente',
      },
    },
    fields: {
      name: 'Nombre',
      email: 'Email',
      segment: 'Segmento',
      responsibleId: 'Responsable',
      status: 'Estado',
      type: 'Tipo',
      pipeline: 'Pipeline',
      phone: 'Teléfono',
      cnpj: 'CNPJ',
      instagram: 'Instagram',
      linkedin: 'LinkedIn',
      whatsapp: 'WhatsApp',
      role: 'Rol',
      managerId: 'Gerente',
      title: 'Título',
      accountId: 'Cuenta',
      value: 'Valor',
      currency: 'Moneda',
      stage: 'Etapa',
      probability: 'Probabilidad',
      closingDate: 'Fecha de cierre',
      id: 'ID',
      page: 'Página',
      size: 'Tamaño',
      filter: 'Filtro',
      price: 'Precio',
      skuCode: 'Código SKU',
      description: 'Descripción',
      // AccountTimeline fields
      date: 'Fecha',
      createdBy: 'Creado por',
      // BusinessProposal fields
      businessId: 'Negocio',
      content: 'Contenido',
      themeColor: 'Color del tema',
      termsAndConditions: 'Términos y condiciones',
      showUnitPrices: 'Mostrar precios unitarios',
      sendMessage: 'Mensaje de envío',
      sendStatus: 'Estado de envío',
      sendNumber: 'Número de envío',
      // BusinessProposalItem fields
      proposalId: 'Propuesta',
      itemId: 'Artículo',
      quantity: 'Cantidad',
      unitPrice: 'Precio unitario',
      discount: 'Descuento',
      total: 'Total',
    },
    timeline_types: {
      NOTE: 'Nota',
      CALL: 'Llamada',
      EMAIL: 'Email',
      MEETING: 'Reunión',
      SYSTEM: 'Sistema',
    },
  },
};

// Função para obter o idioma da requisição
export function getLanguageFromRequest(req: any): Language {
  const locale = req.headers['locale'] || req.headers['Locale'];
  
  // Validar se o locale é um dos valores aceitos
  const validLocales: Language[] = ['pt-BR', 'en-US', 'es-CO'];
  
  if (locale && validLocales.includes(locale as Language)) {
    return locale as Language;
  }
  
  return 'pt-BR'; // Default para português brasileiro
}

// Função para obter traduções
export function getTranslations(language: Language = 'pt-BR'): Translations {
  return translations[language] || translations['pt-BR'];
}

// Função para traduzir nome de campo
export function translateFieldName(fieldName: string, language: Language = 'pt-BR'): string {
  const t = getTranslations(language);
  return t.fields[fieldName as keyof typeof t.fields] || fieldName;
}

// Função para criar mensagem de validação
export function createValidationMessage(
  fieldName: string, 
  errorType: string, 
  language: Language = 'pt-BR',
  params?: Record<string, any>
): string {
  const t = getTranslations(language);
  const translatedField = translateFieldName(fieldName, language);
  
  let errorMessage = '';
  
  switch (errorType.toLowerCase()) {
    case 'required':
      errorMessage = t.errors.validation.required;
      break;
    case 'email':
    case 'invalid_type':
      if (fieldName.includes('email')) {
        errorMessage = t.errors.validation.invalid_email;
      } else {
        errorMessage = t.errors.validation.invalid_data;
      }
      break;
    case 'uuid':
      errorMessage = t.errors.validation.invalid_uuid;
      break;
    case 'min':
      errorMessage = t.errors.validation.min_length.replace('{min}', params?.minimum || '1');
      break;
    case 'max':
      errorMessage = t.errors.validation.max_length.replace('{max}', params?.maximum || '100');
      break;
    default:
      errorMessage = t.errors.validation.invalid_data;
  }
  
  return `${translatedField} ${errorMessage}`;
}

// Função para obter mensagem de erro de relacionamento
export function getRelationshipErrorMessage(
  errorDetails: string, 
  language: Language = 'pt-BR'
): string {
  const t = getTranslations(language);
  
  // Business proposal specific relationship errors
  if (errorDetails.includes('business_proposal') && errorDetails.includes('business_id')) {
    return t.errors.relationships.business_not_found;
  } else if (errorDetails.includes('business_proposal') && errorDetails.includes('responsible_id')) {
    return t.errors.relationships.user_not_found;
  } else if (errorDetails.includes('business_proposal_item') && errorDetails.includes('proposal_id')) {
    return t.errors.relationships.proposal_not_found;
  } else if (errorDetails.includes('business_proposal_item') && errorDetails.includes('item_id')) {
    return t.errors.relationships.item_not_found;
  }
  // General relationship errors
  else if (errorDetails.includes('responsible_id')) {
    return t.errors.relationships.owner_not_found;
  } else if (errorDetails.includes('business_id')) {
    return t.errors.relationships.business_not_found;
  } else if (errorDetails.includes('proposal_id')) {
    return t.errors.relationships.proposal_not_found;
  } else if (errorDetails.includes('item_id')) {
    return t.errors.relationships.item_not_found;
  } else if (errorDetails.includes('account_id')) {
    // Check if it's timeline-specific account relationship
    if (errorDetails.includes('account_timeline')) {
      return t.errors.relationships.timeline_account_not_found;
    }
    return t.errors.relationships.account_not_found;
  } else if (errorDetails.includes('manager_id')) {
    return t.errors.relationships.manager_not_found;
  } else if (errorDetails.includes('responsible_id')) {
    return t.errors.relationships.timeline_creator_not_found;
  }
  
  return t.errors.relationships.relationship_error;
}

// Função para obter mensagem de entidade não encontrada
export function getNotFoundMessage(entityType: string, language: Language = 'pt-BR'): string {
  const t = getTranslations(language);
  
  switch (entityType.toLowerCase()) {
    case 'account':
      return t.errors.not_found.account;
    case 'user':
      return t.errors.not_found.user;
    case 'business':
      return t.errors.not_found.business;
    case 'item':
      return t.errors.not_found.item;
    case 'timeline':
      return t.errors.not_found.timeline;
    case 'proposal':
    case 'businessproposal':
      return t.errors.not_found.proposal;
    case 'proposal_item':
    case 'proposalitem':
    case 'businessproposalitem':
      return t.errors.not_found.proposal_item;
    default:
      return t.errors.not_found.route;
  }
}

// Função para obter mensagem de sucesso
export function getSuccessMessage(
  action: string, 
  entityType: string, 
  language: Language = 'pt-BR'
): string {
  const t = getTranslations(language);
  
  switch (action.toLowerCase()) {
    case 'deleted':
      switch (entityType.toLowerCase()) {
        case 'account':
          return t.success.deleted.account;
        case 'user':
          return t.success.deleted.user;
        case 'business':
          return t.success.deleted.business;
        case 'item':
          return t.success.deleted.item;
        case 'timeline':
          return t.success.deleted.timeline;
        case 'proposal':
        case 'businessproposal':
          return t.success.deleted.proposal;
        case 'proposal_item':
        case 'proposalitem':
        case 'businessproposalitem':
          return t.success.deleted.proposal_item;
      }
      break;
    case 'created':
      switch (entityType.toLowerCase()) {
        case 'item':
          return t.success.created.item;
        case 'timeline':
          return t.success.created.timeline;
        case 'proposal':
        case 'businessproposal':
          return t.success.created.proposal;
        case 'proposal_item':
        case 'proposalitem':
        case 'businessproposalitem':
          return t.success.created.proposal_item;
      }
      break;
    case 'updated':
      switch (entityType.toLowerCase()) {
        case 'item':
          return t.success.updated.item;
        case 'timeline':
          return t.success.updated.timeline;
        case 'proposal':
        case 'businessproposal':
          return t.success.updated.proposal;
        case 'proposal_item':
        case 'proposalitem':
        case 'businessproposalitem':
          return t.success.updated.proposal_item;
      }
      break;
  }
  
  return 'Operação realizada com sucesso';
}

// Função para traduzir tipos de timeline
export function translateTimelineType(timelineType: string, language: Language = 'pt-BR'): string {
  const t = getTranslations(language);
  
  switch (timelineType.toUpperCase()) {
    case 'NOTE':
      return t.timeline_types.NOTE;
    case 'CALL':
      return t.timeline_types.CALL;
    case 'EMAIL':
      return t.timeline_types.EMAIL;
    case 'MEETING':
      return t.timeline_types.MEETING;
    case 'SYSTEM':
      return t.timeline_types.SYSTEM;
    default:
      return timelineType;
  }
}

// Função para obter mensagem de sucesso específica para timeline
export function getTimelineSuccessMessage(
  action: string, 
  language: Language = 'pt-BR'
): string {
  return getSuccessMessage(action, 'timeline', language);
}

// Função para obter mensagem de erro "timeline não encontrado"
export function getTimelineNotFoundMessage(language: Language = 'pt-BR'): string {
  return getNotFoundMessage('timeline', language);
}

// Dashboard month localization utilities
export const MonthNames = {
  'pt-BR': [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  'en-US': [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  'es-CO': [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
} as const;

/**
 * Translates a month number (1-12) to localized month name
 * @param monthNumber - Month number (1 = January, 12 = December)
 * @param language - Target language for translation
 * @returns Localized month name
 */
export function translateMonthName(monthNumber: number, language: Language = 'pt-BR'): string {
  // Validate month number range
  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error(`Invalid month number: ${monthNumber}. Must be between 1 and 12.`);
  }
  
  const monthNames = MonthNames[language] || MonthNames['pt-BR'];
  return monthNames[monthNumber - 1]; // Array is 0-indexed, months are 1-indexed
}

/**
 * Creates a complete monthly revenue response object with localized month names
 * @param monthlyData - Array of objects with month number and revenue value
 * @param language - Target language for month names
 * @returns Object with localized month names as keys and revenue as values
 */
export function createLocalizedMonthlyResponse(
  monthlyData: Array<{ month: number; revenue: number }>,
  language: Language = 'pt-BR'
): Record<string, number> {
  const response: Record<string, number> = {};
  
  // Initialize all months with zero revenue
  for (let month = 1; month <= 12; month++) {
    const monthName = translateMonthName(month, language);
    response[monthName] = 0;
  }
  
  // Fill in actual revenue data
  monthlyData.forEach(({ month, revenue }) => {
    const monthName = translateMonthName(month, language);
    response[monthName] = revenue;
  });
  
  return response;
}

// Função para obter mensagem de erro de tenant traduzida
export function getTenantErrorMessage(
  errorCode: string,
  language: Language = 'pt-BR'
): string {
  const t = getTranslations(language);
  
  // Mapear códigos de erro para chaves de tradução
  const errorKeyMap: Record<string, keyof typeof t.errors.tenant> = {
    'TENANT_HEADER_MISSING': 'header_missing',
    'TENANT_HEADER_EMPTY': 'header_empty',
    'TENANT_FORMAT_INVALID': 'format_invalid',
    'TENANT_ID_MALFORMED': 'id_malformed',
    'SCHEMA_CREATION_FAILED': 'schema_creation_failed',
    'SCHEMA_MIGRATION_FAILED': 'schema_migration_failed',
    'SCHEMA_VALIDATION_FAILED': 'schema_validation_failed',
    'SCHEMA_ACCESS_DENIED': 'schema_access_denied',
    'DATABASE_UNAVAILABLE': 'database_unavailable',
    'DATABASE_CONNECTION_TIMEOUT': 'database_connection_timeout',
    'DATABASE_CONNECTION_FAILED': 'database_connection_failed',
    'CONTEXT_SETUP_FAILED': 'context_setup_failed',
    'CONTEXT_CLEANUP_FAILED': 'context_cleanup_failed',
    'SEARCH_PATH_UPDATE_FAILED': 'search_path_update_failed'
  };
  
  const errorKey = errorKeyMap[errorCode];
  if (errorKey && t.errors.tenant[errorKey]) {
    return t.errors.tenant[errorKey];
  }
  
  // Fallback para mensagem padrão se não encontrar tradução
  return errorCode;
}