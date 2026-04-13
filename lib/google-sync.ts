import { Platform } from 'react-native';

const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const SYNC_FILE_NAME = 'pockit_data.json';

export interface PockItSyncData {
  pinnedFeatures: string[];
  lastUpdated: number;
}

/**
 * Utility to sync data with Google Drive AppData folder.
 * Requires 'https://www.googleapis.com/auth/drive.appdata' scope.
 */
export class GoogleSync {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Finds the sync file in the AppData folder.
   * Returns the file ID if found, null otherwise.
   */
  async findSyncFile(): Promise<string | null> {
    try {
      const response = await fetch(
        `${DRIVE_FILES_URL}?spaces=appDataFolder&q=name='${SYNC_FILE_NAME}'&fields=files(id, name)`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.files && data.files.length > 0) {
        return data.files[0].id;
      }
      return null;
    } catch (error) {
      console.error('[GoogleSync] Find error:', error);
      return null;
    }
  }

  /**
   * Downloads the sync data from Google Drive.
   */
  async downloadData(fileId: string): Promise<PockItSyncData | null> {
    try {
      const response = await fetch(`${DRIVE_FILES_URL}/${fileId}?alt=media`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[GoogleSync] Download error:', error);
      return null;
    }
  }

  /**
   * Uploads data to Google Drive. Creates the file if it doesn't exist.
   */
  async uploadData(data: PockItSyncData): Promise<boolean> {
    try {
      let fileId = await this.findSyncFile();

      if (!fileId) {
        // Create new file
        const metadata = {
          name: SYNC_FILE_NAME,
          parents: ['appDataFolder'],
        };

        const createRes = await fetch(DRIVE_FILES_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metadata),
        });

        const createdFile = await createRes.json();
        fileId = createdFile.id;
      }

      if (!fileId) return false;

      // Update file content
      const updateRes = await fetch(`${DRIVE_UPLOAD_URL}/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return updateRes.ok;
    } catch (error) {
      console.error('[GoogleSync] Upload error:', error);
      return false;
    }
  }
}
