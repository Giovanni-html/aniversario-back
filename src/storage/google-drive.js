const { google } = require('googleapis');
const stream = require('stream');

// Initialize Google Drive client with Service Account
let driveClient = null;

/**
 * Get authenticated Google Drive client
 * Uses Service Account credentials from environment variables
 */
function getDriveClient() {
  if (driveClient) {
    return driveClient;
  }

  // Service Account credentials from environment
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Google Drive credentials not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

/**
 * Upload a file to Google Drive
 * @param {Buffer} fileBuffer - The file buffer to upload
 * @param {string} fileName - Name for the file
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<{id: string, webViewLink: string, webContentLink: string}>}
 */
async function uploadFile(fileBuffer, fileName, mimeType) {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID not configured');
  }

  // Create a readable stream from buffer
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${fileName}`;

  const response = await drive.files.create({
    requestBody: {
      name: uniqueFileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: bufferStream,
    },
    fields: 'id, name, webViewLink, webContentLink, size',
    supportsAllDrives: true,
  });

  // Make file publicly viewable
  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
    supportsAllDrives: true,
  });

  // Get updated file info with sharing links
  const fileInfo = await drive.files.get({
    fileId: response.data.id,
    fields: 'id, name, webViewLink, webContentLink, thumbnailLink, size',
    supportsAllDrives: true,
  });

  console.log(`✅ Uploaded to Google Drive: ${uniqueFileName} (ID: ${fileInfo.data.id})`);

  return {
    id: fileInfo.data.id,
    name: fileInfo.data.name,
    url: fileInfo.data.webContentLink || `https://drive.google.com/uc?id=${fileInfo.data.id}&export=view`,
    webViewLink: fileInfo.data.webViewLink,
    thumbnailLink: fileInfo.data.thumbnailLink,
    size: parseInt(fileInfo.data.size) || 0,
  };
}

/**
 * Delete a file from Google Drive
 * @param {string} fileId - Google Drive file ID
 */
async function deleteFile(fileId) {
  const drive = getDriveClient();
  
  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  });

  console.log(`🗑️ Deleted from Google Drive: ${fileId}`);
}

/**
 * List files in the folder
 * @param {number} pageSize - Number of files per page
 * @param {string} pageToken - Token for pagination
 */
async function listFiles(pageSize = 50, pageToken = null) {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  const params = {
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'nextPageToken, files(id, name, webViewLink, webContentLink, thumbnailLink, size, createdTime)',
    pageSize,
    orderBy: 'createdTime desc',
  };

  if (pageToken) {
    params.pageToken = pageToken;
  }

  const response = await drive.files.list(params);

  return {
    files: response.data.files.map(file => ({
      id: file.id,
      name: file.name,
      url: file.webContentLink || `https://drive.google.com/uc?id=${file.id}&export=view`,
      webViewLink: file.webViewLink,
      thumbnailLink: file.thumbnailLink,
      size: parseInt(file.size) || 0,
      createdTime: file.createdTime,
    })),
    nextPageToken: response.data.nextPageToken,
  };
}

module.exports = {
  uploadFile,
  deleteFile,
  listFiles,
};
