import { isEmpty, merge } from 'lodash';
import { Service, Adapter, Blob, Analyzer } from '@uplo/types';

const analyze =
  ({
    service,
    adapter,
    analyzers,
  }: {
    service: Service;
    adapter: Adapter;
    analyzers: Analyzer[];
  }) =>
  async ({ key }: Blob): Promise<object> => {
    if (isEmpty(analyzers)) {
      console.warn(
        `[Uplo] No analyzers provided. Skipping analyze for Blob ${key}`
      );
      return {};
    }

    let blob = await adapter.findBlobByKey(key);
    if (!blob) {
      throw new Error(`[Uplo] Cannot find blob with key ${key}`);
    }

    const newMetadata = {};

    await service.downloadToTempfile({ key: blob.key }, async (filePath) => {
      merge(newMetadata, { identified: true });

      for (const analyzer of analyzers) {
        try {
          if (blob) {
            const analyzerMetadata = await analyzer({ filePath, blob });
            if (!isEmpty(analyzerMetadata)) {
              merge(newMetadata, analyzerMetadata);
            }
          }
        } catch (err) {
          console.error('[Uplo] Failed to run analyzer.', err);
        }
      }

      merge(newMetadata, { analyzed: true });
    });

    blob = await adapter.findBlobByKey(key);
    if (blob) {
      const metadata = { ...blob.metadata, ...newMetadata };
      await adapter.updateBlobMetadata({ key, metadata });
    }

    return newMetadata;
  };

export default analyze;
