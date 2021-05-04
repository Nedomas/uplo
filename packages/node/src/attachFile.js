import _ from 'lodash';

const attachFile = ({ service, prisma, signer }) => async ({
  signedId,
  modelName,
  modelId,
  name,
  returnQuery = true,
  strategy = 'append',
}) => {
  const { blobId } = await signer.verify(signedId, 'blob');
  const recordType = _.upperFirst(_.camelCase(modelName));

  const blob = await prisma.activeStorageBlob.findUnique({
    where: { id: blobId },
  });

  await service.updateMetadata(blob.key, { contentType: blob.contentType });

  if (strategy === 'replace') {
    await prisma.activeStorageAttachment.deleteMany({
      where: {
        name,
        recordType,
        recordId: modelId,
      },
    });
  }

  const query = prisma.activeStorageAttachment.create({
    data: {
      name,
      recordType,
      recordId: modelId,
      blob: { connect: { id: blobId } },
    },
  });

  if (returnQuery) {
    return { query };
  }

  return await query;
};

export default attachFile;
