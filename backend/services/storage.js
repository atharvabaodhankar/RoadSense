const supabase = require("../lib/supabase");

async function uploadToStorage(bucket, fileName, buffer) {
  try {
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error(`Storage upload error (${bucket}):`, error);
    throw new Error(`Failed to upload to ${bucket}`);
  }
}

module.exports = { uploadToStorage };
