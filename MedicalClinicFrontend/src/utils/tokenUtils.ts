/**
 * Token utility for handling JWT operations
 * Provides functions for decoding, checking expiration, and managing token refresh
 */

import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/api';
import { store } from '../store/store';
import { logout } from '../store/slices/authSlice';

interface DecodedToken {
  exp: number;
  iat: number;
  id: string;
  role: string;
  [key: string]: any;
}

/**
 * Decodes a JWT token without verification
 * @param token JWT token string
 * @returns Decoded token or null if invalid
 */
export const decodeToken = (token: string): DecodedToken | null => {
  if (!token) return null;
  
  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

/**
 * Checks if a token has expired
 * @param token JWT token string
 * @param bufferSeconds Optional time buffer in seconds (default: 60)
 * @returns Boolean indicating if token has expired or is about to expire
 */
export const isTokenExpired = (token: string, bufferSeconds = 60): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  
  // Calculate expiration with buffer (current time + buffer in seconds)
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < (currentTime + bufferSeconds);
};

/**
 * Refreshes the token if it's about to expire
 * @returns Promise resolving to a boolean indicating success
 */
export const refreshTokenIfNeeded = async (): Promise<boolean> => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Check if token is close to expiring (within 5 minutes)
    if (isTokenExpired(token, 300)) {
      // Token is expiring soon, attempt to refresh
      const response = await authService.refreshToken();
      if (response && response.token) {
        localStorage.setItem('token', response.token);
        return true;
      }
      return false;
    }
    return true; // Token is still valid
  } catch (error) {
    console.error('Failed to refresh token:', error);
    // On failure, logout the user
    store.dispatch(logout());
    return false;
  }
};

/**
 * Gets the user's role from the stored token
 * @returns The user's role or null if not found
 */
export const getRoleFromToken = (): string | null => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  const decoded = decodeToken(token);
  return decoded?.role || null;
};

export default {
  decodeToken,
  isTokenExpired,
  refreshTokenIfNeeded,
  getRoleFromToken
};
