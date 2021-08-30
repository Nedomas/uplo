import { PrismaClient } from '@prisma/client';
import { CreateBlobOptions, AttachBlobOptions, Adapter, Blob, Service } from '@uplo/types';

class PrismaAdapter extends Adapter {
  prisma: PrismaClient;

  constructor({ prisma }: { prisma: PrismaClient }) {
    super();
    this.prisma = prisma;
  }

  async createBlob({ params, service }: CreateBlobOptions): Promise<Blob> {
    const blob = await this.prisma.fileBlob.create({
      data: {
        key: params.key,
        filename: params.fileName,
        contentType: params.contentType,
        size: params.size,
        metadata: params.metadata || {},
        checksum: params.checksum,
        serviceName: service.name()
      },
    });

    return blob;
  };

  async findBlob (id: string | number): Promise<Blob | null> {
    return await this.prisma.fileBlob.findUnique({
      where: { id },
    });
  }

  async findBlobByKey(key: string) {
    const blob = await this.prisma.fileBlob.findUnique({
      where: { key },
    }) as Blob | null;

    return blob;
  }

  async updateBlobMetadata({ key, metadata }: { key: string, metadata: object }) {
    return await this.prisma.fileBlob.update({
      where: { key },
      data: { metadata }
    });
  }

  async attachBlob({ blob, attachmentName, recordId, recordType, strategy, returnQuery = false }: AttachBlobOptions) {
    if (strategy === 'one') {
      await this.prisma.fileAttachment.deleteMany({
        where: {
          name: attachmentName,
          recordType,
          recordId,
        },
      });
    }

    const query = this.prisma.fileAttachment.create({
      data: {
        name: attachmentName,
        recordType,
        recordId,
        blob: { connect: { id: blob.id } },
      },
    });

    if (returnQuery) {
      return { query };
    }

    return await query;
  }
};

export default PrismaAdapter;
