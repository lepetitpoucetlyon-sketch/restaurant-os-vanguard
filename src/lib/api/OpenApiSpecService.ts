/**
 * 📖 OpenApiSpecService — OpenAPI 3.0.3 Specification Generator (H2.2)
 * Fournit la spécification contractuelle REST publique pour les applications mobiles,
 * les bornes de commande et les intégrations tierces.
 */
export class OpenApiSpecService {
  static getSpec() {
    return {
      openapi: '3.0.3',
      info: {
        title: 'Restaurant OS Enterprise REST API',
        version: '1.0.0',
        description:
          'API REST publique haute performance pour les modules POS, Mobile Server, Bornes et Self-Ordering QR.',
        contact: {
          name: 'Restaurant OS Engineering',
          email: 'api@restaurant-empire.fr',
        },
      },
      servers: [
        {
          url: '/api/v1',
          description: 'API Gateway v1',
        },
      ],
      paths: {
        '/menu': {
          get: {
            summary: 'Récupérer la carte et le menu du restaurant',
            description: 'Retourne la liste des catégories, produits, allergènes et prix en vigueur.',
            parameters: [
              {
                name: 'tenantId',
                in: 'query',
                required: true,
                schema: { type: 'string' },
                description: 'Identifiant unique du restaurant / tenant',
              },
            ],
            responses: {
              '200': {
                description: 'Carte du restaurant',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        tenantId: { type: 'string' },
                        categories: { type: 'array', items: { type: 'string' } },
                        products: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              category: { type: 'string' },
                              priceInMicrounits: { type: 'integer' },
                              allergens: { type: 'array', items: { type: 'string' } },
                              available: { type: 'boolean' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/orders': {
          post: {
            summary: 'Créer une nouvelle commande (POS, Mobile ou Table)',
            description: 'Valide les articles, enregistre la commande et route vers le KDS de cuisine.',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: ['tenantId', 'items'],
                    properties: {
                      tenantId: { type: 'string' },
                      tableId: { type: 'string' },
                      channel: { type: 'string', enum: ['POS', 'MOBILE_SERVER', 'QR_TABLE', 'DELIVERY'] },
                      operatorId: { type: 'string' },
                      items: {
                        type: 'array',
                        items: {
                          type: 'object',
                          required: ['productId', 'quantity'],
                          properties: {
                            productId: { type: 'string' },
                            quantity: { type: 'integer', minimum: 1 },
                            course: { type: 'string', enum: ['entree', 'plat', 'dessert'] },
                            notes: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            responses: {
              '201': {
                description: 'Commande créée avec succès',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        orderId: { type: 'string' },
                        status: { type: 'string' },
                        totalInMicrounits: { type: 'integer' },
                        createdAt: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '/orders/{id}': {
          get: {
            summary: 'Consulter le statut d’une commande',
            description: 'Retourne le statut de préparation KDS, la liste des articles et le total.',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                description: 'Identifiant unique de la commande',
              },
            ],
            responses: {
              '200': {
                description: 'Détails de la commande',
              },
              '404': {
                description: 'Commande introuvable',
              },
            },
          },
        },
        '/tables': {
          get: {
            summary: 'Récupérer le plan de salle et l’état des tables',
            description: 'Retourne la liste des tables avec leur statut d’occupation.',
            responses: {
              '200': {
                description: 'Liste des tables',
              },
            },
          },
        },
      },
    };
  }
}
