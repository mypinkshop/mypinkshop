export const uploadToR2 = async (env, file, path) => {
  try {
    const bucket = env.BUCKET;
    const key = `${path}/${Date.now()}-${file.name}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    await bucket.put(key, uint8Array, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream'
      }
    });
    
    const publicUrl = `https://pub-${env.BUCKET.id}.r2.dev/${key}`;
    return publicUrl;
  } catch (error) {
    console.error('R2 Upload Error:', error);
    throw new Error('Failed to upload file');
  }
};

export const deleteFromR2 = async (env, key) => {
  try {
    const bucket = env.BUCKET;
    await bucket.delete(key);
    return true;
  } catch (error) {
    console.error('R2 Delete Error:', error);
    throw new Error('Failed to delete file');
  }
};
