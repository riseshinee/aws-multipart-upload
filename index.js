//file은 프론트에서 form-data 로 전달받음

const multipartCreateResult = await s3.createMultipartUpload({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${directoryName}/${uploadFileName}`,
    ACL: "public-read",
    ContentType: file.mimetype,
    ContentDisposition : "attachment",
    StorageClass: 'STANDARD'
  }).promise()

  const partSize = (1024 * 1024) * 50 // 분할할 파일 사이즈 크기
  const fileSize = file.size;
  const numParts = Math.ceil(fileSize / partSize)

  const uploadedParts = [];
  let remainingBytes = fileSize;

  for (let i = 1; i <= numParts; i ++) {
    let startOfPart = fileSize - remainingBytes
    let endOfPart = Math.min(partSize, startOfPart + remainingBytes)

    if (i > 1) {
      endOfPart = startOfPart + Math.min(partSize, remainingBytes)
      startOfPart += 1
    } 

    let uploadPartResults = await s3.uploadPart({
      Body: file.buffer.slice(startOfPart, endOfPart + 1),
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${directoryName}/${uploadFileName}`,
      PartNumber: i,
      UploadId: multipartCreateResult.UploadId // s3.createMultipartUpload 함수에서 받은 id
    }).promise()

    remainingBytes -= Math.min(partSize, remainingBytes)
    uploadedParts.push({ PartNumber: i, ETag: uploadPartResults.ETag })
  }

  uploadFile = await s3.completeMultipartUpload({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${directoryName}/${uploadFileName}`,
    MultipartUpload: {
      Parts: uploadedParts
    },
    UploadId: multipartCreateResult.UploadId 
  }).promise()

