import { useState } from 'react';
import { toast } from 'sonner';

interface ShareToLinkedInParams {
  content: string;
  hashtags?: string[];
  visibility?: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN_MEMBERS';
}

interface ShareResponse {
  success: boolean;
  message: string;
  share_id?: string;
  share_url?: string;
}

export function useLinkedInShare() {
  const [isSharing, setIsSharing] = useState(false);

  const shareToLinkedIn = async (params: ShareToLinkedInParams): Promise<ShareResponse> => {
    setIsSharing(true);

    try {
      console.log('Sharing to LinkedIn:', params);

      const response = await fetch('/api/social/linkedin/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are sent
        body: JSON.stringify({
          content: params.content,
          hashtags: params.hashtags || [],
          visibility: params.visibility || 'PUBLIC',
        }),
      });

      const data = await response.json();
      console.log('LinkedIn share response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.message || 'Failed to share to LinkedIn');
      }

      toast.success('Content shared successfully to LinkedIn!');

      return {
        success: true,
        message: data.message,
        share_id: data.share_id,
        share_url: data.share_url,
      };

    } catch (error) {
      console.error('LinkedIn share error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to share to LinkedIn';
      toast.error(errorMessage);

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsSharing(false);
    }
  };

  const checkLinkedInConnection = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/social-accounts', {
        credentials: 'include', // Ensure cookies are sent
      });

      if (!response.ok) {
        console.error('Failed to fetch social accounts:', response.status);
        return false;
      }

      const accounts = await response.json();

      // Check if LinkedIn account exists and is not expired
      const linkedinAccount = accounts.find((account: any) => account.platform === 'linkedin');

      if (!linkedinAccount) {
        return false;
      }

      // Check if token is expired
      if (linkedinAccount.expires_at) {
        const now = new Date();
        const expiresAt = new Date(linkedinAccount.expires_at);

        if (now >= expiresAt) {
          console.log('LinkedIn token is expired');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking LinkedIn connection:', error);
      return false;
    }
  };

  return {
    shareToLinkedIn,
    isSharing,
    checkLinkedInConnection,
  };
}
