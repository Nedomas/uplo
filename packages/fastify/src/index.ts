import { FastifyPluginAsync } from 'fastify';
import { UploInstance } from '@uplo/node';

export interface UploPluginOptions {
  mountPath?: string;
  uplo: UploInstance;
}

const createDirectUploadOptions = {
  schema: {
    body: {
      type: 'object',
      required: ['fileName', 'contentType', 'checksum', 'size'],
      properties: {
        attachmentName: { type: 'string' },
        fileName: { type: 'string' },
        contentType: { type: 'string' },
        checksum: { type: 'string' },
        size: { type: 'number' },
        metadata: { type: 'object' },
      }
    }
  }
}

interface CreateDirectUploadBody {
  attachmentName: string;
  fileName: string;
  contentType: string;
  size: number;
  checksum: string;
  metadata?: {
    [key: string]: number | string;
  };
}

const fastifyPlugin: FastifyPluginAsync<UploPluginOptions> = async (fastify, { uplo, mountPath = '/uploads' }) => {
  fastify.decorate('uplo', uplo);

  fastify.post<{ Body: CreateDirectUploadBody}>(`${mountPath}/create-direct-upload`, createDirectUploadOptions, async (request, reply) => {

    const params = {
      attachmentName: request.body['attachmentName'],
      fileName: request.body['fileName'],
      contentType: request.body['contentType'],
      size: request.body['size'],
      checksum: request.body['checksum'],
      metadata: request.body['metadata'],
    };

    const data = await uplo.createDirectUpload({ params });

    reply.send(data).status(201);
  })
}

export default fastifyPlugin;
