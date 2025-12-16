# Requirements Document

## Introduction

Este documento especifica os requisitos para implementação das entidades businessProposal e businessProposalItem no sistema CRM. As propostas comerciais (businessProposal) representam ofertas formais enviadas aos clientes, contendo itens detalhados (businessProposalItem) com preços, quantidades e descontos. O sistema deve seguir o padrão CRUD estabelecido pelas outras entidades do sistema, incluindo validações multilíngues e relacionamentos apropriados.

## Glossary

- **BusinessProposal**: Entidade que representa uma proposta comercial vinculada a um negócio e responsável
- **BusinessProposalItem**: Item individual dentro de uma proposta, vinculado a um item do catálogo com quantidade e preços específicos
- **Business**: Entidade de negócio existente no sistema à qual a proposta está vinculada
- **User**: Usuário responsável pela proposta
- **Item**: Item do catálogo que pode ser incluído nas propostas
- **Sistema_CRM**: O sistema de gerenciamento de relacionamento com clientes

## Requirements

### Requirement 1

**User Story:** Como um usuário do sistema, eu quero criar propostas comerciais, para que eu possa formalizar ofertas aos clientes com itens detalhados e valores específicos.

#### Acceptance Criteria

1. WHEN um usuário cria uma proposta comercial, THE Sistema_CRM SHALL validar que todos os campos obrigatórios estão preenchidos (businessId, responsibleId, title, status, date, value)
2. WHEN uma proposta é criada, THE Sistema_CRM SHALL definir o status padrão como "Rascunho"
3. WHEN uma proposta é criada, THE Sistema_CRM SHALL validar que o businessId referencia um negócio existente
4. WHEN uma proposta é criada, THE Sistema_CRM SHALL validar que o responsibleId referencia um usuário existente
5. WHEN uma proposta é criada, THE Sistema_CRM SHALL gerar um UUID único para o campo id

### Requirement 2

**User Story:** Como um usuário do sistema, eu quero adicionar itens às propostas comerciais, para que eu possa especificar produtos/serviços com quantidades, preços unitários e descontos.

#### Acceptance Criteria

1. WHEN um item é adicionado à proposta, THE Sistema_CRM SHALL validar que todos os campos obrigatórios estão preenchidos (proposalId, itemId, name, quantity, unitPrice, total)
2. WHEN um item é adicionado, THE Sistema_CRM SHALL validar que o proposalId referencia uma proposta existente
3. WHEN um item é adicionado, THE Sistema_CRM SHALL validar que o itemId referencia um item existente no catálogo
4. WHEN um item é adicionado, THE Sistema_CRM SHALL calcular automaticamente o total baseado em quantity, unitPrice e discount
5. WHEN um item é adicionado, THE Sistema_CRM SHALL gerar um UUID único para o campo id

### Requirement 3

**User Story:** Como um usuário do sistema, eu quero consultar propostas comerciais com filtros e paginação, para que eu possa encontrar propostas específicas de forma eficiente.

#### Acceptance Criteria

1. WHEN um usuário consulta propostas, THE Sistema_CRM SHALL retornar uma lista paginada com informações completas das propostas
2. WHEN filtros são aplicados, THE Sistema_CRM SHALL processar a sintaxe de filtro dinâmico seguindo o padrão estabelecido
3. WHEN uma proposta específica é consultada por ID, THE Sistema_CRM SHALL retornar todos os dados da proposta incluindo os itens relacionados
4. WHEN uma proposta não existe, THE Sistema_CRM SHALL retornar erro 404 com mensagem apropriada no idioma da requisição
5. WHEN parâmetros de paginação são inválidos, THE Sistema_CRM SHALL retornar erro de validação com mensagens traduzidas

### Requirement 4

**User Story:** Como um usuário do sistema, eu quero atualizar propostas comerciais e seus itens, para que eu possa modificar informações conforme necessário durante o processo de negociação.

#### Acceptance Criteria

1. WHEN uma proposta é atualizada, THE Sistema_CRM SHALL validar que a proposta existe antes de aplicar as mudanças
2. WHEN campos de relacionamento são atualizados, THE Sistema_CRM SHALL validar que as referências existem
3. WHEN o status da proposta é alterado, THE Sistema_CRM SHALL validar que o novo status é um dos valores permitidos
4. WHEN itens da proposta são atualizados, THE Sistema_CRM SHALL recalcular o total automaticamente
5. WHEN uma atualização falha por dados inválidos, THE Sistema_CRM SHALL retornar mensagens de erro traduzidas

### Requirement 5

**User Story:** Como um usuário do sistema, eu quero excluir propostas comerciais e seus itens, para que eu possa remover propostas desnecessárias ou canceladas.

#### Acceptance Criteria

1. WHEN uma proposta é excluída, THE Sistema_CRM SHALL remover todos os itens relacionados automaticamente
2. WHEN uma proposta não existe, THE Sistema_CRM SHALL retornar erro 404 com mensagem apropriada
3. WHEN um item específico é excluído de uma proposta, THE Sistema_CRM SHALL manter a proposta e remover apenas o item
4. WHEN a exclusão é bem-sucedida, THE Sistema_CRM SHALL retornar mensagem de sucesso traduzida
5. WHEN há erro na exclusão, THE Sistema_CRM SHALL retornar mensagem de erro apropriada no idioma da requisição

### Requirement 6

**User Story:** Como um usuário do sistema, eu quero que todas as mensagens de validação e erro sejam exibidas no meu idioma preferido, para que eu possa compreender facilmente os problemas e sucessos nas operações.

#### Acceptance Criteria

1. WHEN ocorre erro de validação, THE Sistema_CRM SHALL retornar mensagens traduzidas para português, inglês e espanhol
2. WHEN campos obrigatórios estão ausentes, THE Sistema_CRM SHALL especificar quais campos são obrigatórios no idioma da requisição
3. WHEN relacionamentos são inválidos, THE Sistema_CRM SHALL informar qual entidade relacionada não foi encontrada
4. WHEN operações são bem-sucedidas, THE Sistema_CRM SHALL retornar mensagens de sucesso traduzidas
5. WHEN o idioma não é especificado no header, THE Sistema_CRM SHALL usar português brasileiro como padrão

### Requirement 7

**User Story:** Como um desenvolvedor do sistema, eu quero que as entidades sigam o padrão estabelecido de conversão entre formatos de API e banco de dados, para que haja consistência na arquitetura.

#### Acceptance Criteria

1. WHEN dados são recebidos via API, THE Sistema_CRM SHALL converter de camelCase para snake_case antes de armazenar no banco
2. WHEN dados são retornados pela API, THE Sistema_CRM SHALL converter de snake_case para camelCase
3. WHEN relacionamentos são processados, THE Sistema_CRM SHALL usar objetos de referência com apenas o campo id
4. WHEN timestamps são manipulados, THE Sistema_CRM SHALL usar formato ISO 8601
5. WHEN validações são aplicadas, THE Sistema_CRM SHALL usar schemas Zod seguindo o padrão estabelecido