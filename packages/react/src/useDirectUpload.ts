import { useState, useMemo, useCallback } from 'react';
import useConfig from './useConfig';
import createBlob from './createBlob';
import { UploadID, Upload, UploadFileOptions, UseUploadOptions } from './types';
import { uploadAsync } from './uploadAsync';

export const useDirectUpload = (attachmentName: string, { multiple = false }: UseUploadOptions = {}) => {
  const { host, mountPath } = useConfig();

  const [uploads, setUploads] = useState<Upload[]>([]);
  // const host = 'test.com';
  // const mountPath = '/uploads';

  const addUpload = useCallback((upload: Upload) => {
    setUploads((prev) => multiple ? [...prev, upload] : [upload]);
  }, [multiple]);

  const clear = useCallback(() => setUploads([]), []);
  const uploading = useMemo(() => uploads.some((it) => it.uploading === true), [
    uploads,
  ]);
  const signedIds = useMemo(
    () => uploads.map((upload) => upload.signedId).filter((id) => id),
    [uploads]
  );
  const error = useMemo(() => uploads.find((it) => it.error)?.error, [uploads]);

  const updateUpload = useCallback((id: UploadID, upload: Partial<Upload>) => {
    setUploads((prev) => {
      return prev.map((item) => {
        if (item.id !== id) return item;
        return { ...item, ...upload };
      });
    });
  }, []);

  const uploadFile = useCallback(
    async ({ file, id: providedId, metadata }: UploadFileOptions) => {
      const id = providedId || Date.now().toString();

      let upload: Upload = {
        id,
        file,
        uploading: true,
        signedId: null,
      };

      addUpload(upload);

      try {
        const result = await createBlob(attachmentName, { file, metadata }, { host, mountPath });
        if (result.error) {
          upload.error = result.error;
          updateUpload(id, { error: upload.error });
          return upload;
        }

        const { status } = await uploadAsync(
          result.data.upload.url,
          result.data.upload.headers,
          file,
        );

        if (status >= 200 && status < 300) {
          upload.signedId = result.data.signedId;
          updateUpload(id, { signedId: result.data.signedId });
        } else {
          upload.error = 'Failed to upload file';
          updateUpload(id, { error: upload.error });
        }

        upload.uploading = false;
        updateUpload(id, { uploading: false });
      } catch (err) {
        upload.uploading = false;

        if (err instanceof Error) {
          upload.error = err.message;
        } else if (typeof err === 'string') {
          upload.error = err;
        }

        updateUpload(id, { uploading: false, error: err });
      }

      return upload;
    },
    [addUpload, updateUpload]
  );

  return {
    uploadFile,
    uploads,
    uploading,
    signedIds,
    error,
    clear,
  };
};
