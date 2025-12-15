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
    relationships: {
      owner_not_found: string;
      account_not_found: string;
      manager_not_found: string;
      user_not_found: string;
      business_not_found: string;
      relationship_error: string;
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
      route: string;
    };
    server: {
      internal_error: string;
      service_unavailable: string;
      external_service_error: string;
    };
  };
  success: {
    deleted: {
      account: string;
      user: string;
      business: string;
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
      relationships: {
        owner_not_found: 'O responsável informado não existe',
        account_not_found: 'A conta informada não existe',
        manager_not_found: 'O gerente informado não existe',
        user_not_found: 'O usuário informado não existe',
        business_not_found: 'O negócio informado não existe',
        relationship_error: 'Erro de relacionamento entre registros',
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
        route: 'Rota não encontrada',
      },
      server: {
        internal_error: 'Erro interno do servidor',
        service_unavailable: 'Serviço temporariamente indisponível',
        external_service_error: 'Erro no serviço externo',
      },
    },
    success: {
      deleted: {
        account: 'Conta excluída com sucesso',
        user: 'Usuário excluído com sucesso',
        business: 'Negócio excluído com sucesso',
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
      relationships: {
        owner_not_found: 'The specified owner does not exist',
        account_not_found: 'The specified account does not exist',
        manager_not_found: 'The specified manager does not exist',
        user_not_found: 'The specified user does not exist',
        business_not_found: 'The specified business does not exist',
        relationship_error: 'Relationship error between records',
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
        route: 'Route not found',
      },
      server: {
        internal_error: 'Internal server error',
        service_unavailable: 'Service temporarily unavailable',
        external_service_error: 'External service error',
      },
    },
    success: {
      deleted: {
        account: 'Account deleted successfully',
        user: 'User deleted successfully',
        business: 'Business deleted successfully',
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
      relationships: {
        owner_not_found: 'El responsable especificado no existe',
        account_not_found: 'La cuenta especificada no existe',
        manager_not_found: 'El gerente especificado no existe',
        user_not_found: 'El usuario especificado no existe',
        business_not_found: 'El negocio especificado no existe',
        relationship_error: 'Error de relación entre registros',
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
        route: 'Ruta no encontrada',
      },
      server: {
        internal_error: 'Error interno del servidor',
        service_unavailable: 'Servicio temporalmente no disponible',
        external_service_error: 'Error en servicio externo',
      },
    },
    success: {
      deleted: {
        account: 'Cuenta eliminada exitosamente',
        user: 'Usuario eliminado exitosamente',
        business: 'Negocio eliminado exitosamente',
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
  
  if (errorDetails.includes('responsible_id') || errorDetails.includes('owner_id')) {
    return t.errors.relationships.owner_not_found;
  } else if (errorDetails.includes('account_id')) {
    return t.errors.relationships.account_not_found;
  } else if (errorDetails.includes('manager_id')) {
    return t.errors.relationships.manager_not_found;
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
  
  if (action === 'deleted') {
    switch (entityType.toLowerCase()) {
      case 'account':
        return t.success.deleted.account;
      case 'user':
        return t.success.deleted.user;
      case 'business':
        return t.success.deleted.business;
    }
  }
  
  return 'Operação realizada com sucesso';
}